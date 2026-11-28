import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, NestFactory } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { hash } from 'bcrypt';
import { ACCESS_TOKEN_ISSUER_PORT } from '../../application/ports/out/access-token-issuer.port';
import { PASSWORD_HASHER_PORT } from '../../application/ports/out/password-hasher.port';
import { STAFF_CREDENTIALS_PORT } from '../../application/ports/out/staff-credentials.port';
import type { StaffCredentials, StaffCredentialsPort } from '../../application/ports/out/staff-credentials.port';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { configureHttpApp } from '../../interfaces/http/configure-http-app';
import { ProblemDetailsFilter } from '../../interfaces/http/problem-details.filter';
import { RequestIdInterceptor } from '../../interfaces/http/request-id.interceptor';
import { BcryptPasswordHasher } from '../security/bcrypt-password-hasher.adapter';
import { JwtAccessTokenIssuer } from '../security/jwt-access-token-issuer.adapter';
import { AuthController } from './auth.controller';

const PROBLEMS = 'https://api.reservafacil.example/problemas/';
const staffByUsername = new Map<string, StaffCredentials>();

const inMemoryStaffCredentials: StaffCredentialsPort = {
  findByUsername: async (username) => staffByUsername.get(username) ?? null,
};

@Module({
  imports: [
    JwtModule.register({
      secret: 'test-only-secret-with-32-characters!',
      signOptions: { algorithm: 'HS256', expiresIn: 900 },
      verifyOptions: { algorithms: ['HS256'] },
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    { provide: STAFF_CREDENTIALS_PORT, useValue: inMemoryStaffCredentials },
    { provide: PASSWORD_HASHER_PORT, useClass: BcryptPasswordHasher },
    { provide: ACCESS_TOKEN_ISSUER_PORT, useClass: JwtAccessTokenIssuer },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
  ],
})
class AuthTestModule {}

describe('POST /api/v1/auth/login', () => {
  let app: Awaited<ReturnType<typeof NestFactory.create>>;
  let loginUrl: string;

  const login = (body: unknown): Promise<Response> =>
    fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  beforeAll(async () => {
    staffByUsername.set('admin', {
      id: '7',
      role: 'administrador',
      passwordHash: await hash('admin123', 4),
      active: true,
    });
    app = await NestFactory.create(AuthTestModule, { logger: false });
    configureHttpApp(app);
    await app.listen(0, '127.0.0.1');
    loginUrl = `${await app.getUrl()}/api/v1/auth/login`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers 200 with a signed, non-cacheable JWT that carries the account id and role', async () => {
    const response = await login({ username: 'admin', password: 'admin123' });
    const body = (await response.json()) as { accessToken: string; tokenType: string; expiresIn: number };

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body).toEqual({ accessToken: expect.any(String), tokenType: 'Bearer', expiresIn: 900 });

    const claims = await app
      .get(JwtService)
      .verifyAsync<{ sub: string; role: string; iat: number; exp: number }>(body.accessToken);
    expect(claims).toMatchObject({ sub: '7', role: 'administrador' });
    expect(claims.exp - claims.iat).toBe(900);
  });

  it('answers a wrong password and an unknown account with the same generic problem document', async () => {
    const wrongPassword = await login({ username: 'admin', password: 'admin124' });
    const unknownAccount = await login({ username: 'nobody', password: 'admin123' });
    const expected = {
      type: `${PROBLEMS}solicitud-invalida`,
      title: 'Solicitud inválida',
      status: 400,
      detail: 'Credenciales no válidas.',
    };

    expect(wrongPassword.status).toBe(400);
    expect(wrongPassword.headers.get('content-type')).toMatch(/^application\/problem\+json\b/);
    expect(await wrongPassword.json()).toMatchObject(expected);
    expect(unknownAccount.status).toBe(400);
    expect(await unknownAccount.json()).toMatchObject(expected);
  });

  it.each([{}, { username: 'admin' }, { username: 'admin', password: 123 }, { username: '', password: 'admin123' }])(
    'rejects the malformed body %j as an invalid request',
    async (body) => {
      const response = await login(body);

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        type: `${PROBLEMS}solicitud-invalida`,
        detail: "Los campos 'username' y 'password' son obligatorios y deben ser texto no vacío.",
      });
    },
  );
});
