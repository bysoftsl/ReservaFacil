import type { ServerResponse } from 'node:http';
import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import {
  Body,
  type CanActivate,
  Controller,
  type ExecutionContext,
  Get,
  HttpCode,
  Logger,
  Module,
  Post,
  UnauthorizedException,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, NestFactory } from '@nestjs/core';
import { ProblemDetailsFilter } from './problem-details.filter';
import { RequestIdInterceptor } from './request-id.interceptor';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const PROBLEMS = 'https://api.reservafacil.example/problemas/';

class RejectingGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    context.switchToHttp().getResponse<ServerResponse>().setHeader('WWW-Authenticate', 'Bearer');

    throw new UnauthorizedException();
  }
}

@Controller()
class ProbeController {
  @Get('ok')
  ok(): { status: string } {
    return { status: 'ok' };
  }

  @Get('no-content')
  @HttpCode(204)
  noContent(): void {
    return undefined;
  }

  @Get('invalid-dates')
  invalidDates(): never {
    throw new UnprocessableEntityException('La fecha de salida debe ser posterior a la de entrada.');
  }

  @Get('guarded')
  @UseGuards(RejectingGuard)
  guarded(): never {
    throw new Error('unreachable: the guard always rejects');
  }

  @Get('boom')
  boom(): never {
    throw new Error('connection to db.internal:3306 refused for user root');
  }

  @Post('echo')
  echo(@Body() body: unknown): unknown {
    return body;
  }
}

@Module({
  controllers: [ProbeController],
  providers: [
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
  ],
})
class ProbeModule {}

describe('HTTP error contract', () => {
  let app: Awaited<ReturnType<typeof NestFactory.create>>;
  let baseUrl: string;

  beforeAll(async () => {
    app = await NestFactory.create(ProbeModule, { logger: false });
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('RequestIdInterceptor', () => {
    it('generates a UUID v4 per response and ignores the X-Request-Id sent by the client', async () => {
      const response = await fetch(`${baseUrl}/ok`, { headers: { 'X-Request-Id': 'client-supplied-id' } });
      const other = await fetch(`${baseUrl}/ok`);

      expect(response.status).toBe(200);
      expect(response.headers.get('x-request-id')).toMatch(UUID_V4);
      expect(other.headers.get('x-request-id')).toMatch(UUID_V4);
      expect(other.headers.get('x-request-id')).not.toBe(response.headers.get('x-request-id'));
    });

    it('keeps the header on a 204 response, which has no body', async () => {
      const response = await fetch(`${baseUrl}/no-content`);

      expect(response.status).toBe(204);
      expect(response.headers.get('x-request-id')).toMatch(UUID_V4);
      expect(await response.text()).toBe('');
    });
  });

  describe('ProblemDetailsFilter', () => {
    it('answers business errors with an RFC 9457 document that points to the request id', async () => {
      const response = await fetch(`${baseUrl}/invalid-dates`);
      const requestId = response.headers.get('x-request-id');

      expect(response.status).toBe(422);
      expect(response.headers.get('content-type')).toMatch(/^application\/problem\+json\b/);
      expect(requestId).toMatch(UUID_V4);
      expect(await response.json()).toEqual({
        type: `${PROBLEMS}regla-de-negocio`,
        title: 'Regla de negocio incumplida',
        status: 422,
        detail: 'La fecha de salida debe ser posterior a la de entrada.',
        instance: `urn:uuid:${requestId}`,
      });
    });

    it('also covers unknown routes, which fail before any interceptor runs', async () => {
      const response = await fetch(`${baseUrl}/missing`, { headers: { 'X-Request-Id': 'client-supplied-id' } });
      const requestId = response.headers.get('x-request-id');

      expect(response.status).toBe(404);
      expect(response.headers.get('content-type')).toMatch(/^application\/problem\+json\b/);
      expect(requestId).toMatch(UUID_V4);
      expect(await response.json()).toMatchObject({
        type: `${PROBLEMS}recurso-no-encontrado`,
        status: 404,
        instance: `urn:uuid:${requestId}`,
      });
    });

    it('keeps headers set before the failure, such as WWW-Authenticate on a 401', async () => {
      const response = await fetch(`${baseUrl}/guarded`);
      const requestId = response.headers.get('x-request-id');

      expect(response.status).toBe(401);
      expect(response.headers.get('www-authenticate')).toBe('Bearer');
      expect(await response.json()).toEqual({
        type: `${PROBLEMS}no-autenticado`,
        title: 'No autenticado',
        status: 401,
        detail: 'Se requiere un token de acceso válido.',
        instance: `urn:uuid:${requestId}`,
      });
    });

    it('hides the cause of unexpected errors and logs it with the request id', async () => {
      const logged = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

      const response = await fetch(`${baseUrl}/boom`);
      const requestId = response.headers.get('x-request-id');
      const body = JSON.stringify(await response.clone().json());

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        type: `${PROBLEMS}error-interno`,
        title: 'Error interno del servidor',
        status: 500,
        detail: 'Ocurrió un error inesperado. Inténtalo de nuevo más tarde.',
        instance: `urn:uuid:${requestId}`,
      });
      expect(body).not.toContain('db.internal');
      expect(logged).toHaveBeenCalledTimes(1);
      expect(logged).toHaveBeenCalledWith(
        expect.stringContaining(`requestId=${requestId}`),
        expect.stringContaining('db.internal:3306 refused'),
      );
    });

    it('maps malformed JSON to 400 and keeps the status of other HTTP-layer client errors', async () => {
      const malformed = await fetch(`${baseUrl}/echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"checkIn":',
      });
      const oversized = await fetch(`${baseUrl}/echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ padding: 'x'.repeat(200_000) }),
      });

      expect(malformed.status).toBe(400);
      expect(await malformed.json()).toMatchObject({ type: `${PROBLEMS}solicitud-invalida`, status: 400 });
      expect(oversized.status).toBe(413);
      expect(await oversized.json()).toMatchObject({
        type: 'about:blank',
        title: 'Payload Too Large',
        status: 413,
      });
    });
  });
});
