import { STATUS_CODES, type ServerResponse } from 'node:http';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ensureRequestId } from './request-id.interceptor';

const PROBLEM_CONTENT_TYPE = 'application/problem+json; charset=utf-8';
const PROBLEM_TYPE_BASE_URI = 'https://api.reservafacil.example/problemas/';

interface ProblemCategory {
  readonly slug: string;
  readonly title: string;
  readonly detail: string;
}

// Stable error categories for the statuses of the HTTP contract (docs/spec.md, RNF-013-bis).
// Any other status is reported with the registered "about:blank" type.
const problemCategories: Readonly<Record<number, ProblemCategory>> = {
  400: {
    slug: 'solicitud-invalida',
    title: 'Solicitud inválida',
    detail: 'La solicitud está mal formada o contiene datos inválidos.',
  },
  401: {
    slug: 'no-autenticado',
    title: 'No autenticado',
    detail: 'Se requiere un token de acceso válido.',
  },
  403: {
    slug: 'acceso-denegado',
    title: 'Acceso denegado',
    detail: 'El rol de la cuenta no tiene permiso para esta operación.',
  },
  404: {
    slug: 'recurso-no-encontrado',
    title: 'Recurso no encontrado',
    detail: 'El recurso solicitado no existe.',
  },
  409: {
    slug: 'conflicto',
    title: 'Conflicto',
    detail: 'La operación no puede completarse por el estado actual del recurso.',
  },
  422: {
    slug: 'regla-de-negocio',
    title: 'Regla de negocio incumplida',
    detail: 'La solicitud infringe una regla de negocio.',
  },
  500: {
    slug: 'error-interno',
    title: 'Error interno del servidor',
    detail: 'Ocurrió un error inesperado. Inténtalo de nuevo más tarde.',
  },
};

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance: string;
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.adapterHost;
    const response = host.switchToHttp().getResponse<ServerResponse>();
    const requestId = ensureRequestId(response);
    const status = resolveStatus(exception);

    if (status >= 500) {
      // The client only gets a generic detail; the real cause stays in the log, correlated by the request id.
      this.logger.error(
        `Unhandled error ${status} (requestId=${requestId})`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    if (httpAdapter.isHeadersSent(response)) {
      httpAdapter.end(response);
      return;
    }

    // HttpAdapter.reply() rewrites the Content-Type of error bodies to application/json, so the document is written directly.
    httpAdapter.status(response, status);
    httpAdapter.setHeader(response, 'Content-Type', PROBLEM_CONTENT_TYPE);
    httpAdapter.end(response, JSON.stringify(toProblemDetails(status, exception, requestId)));
  }
}

function toProblemDetails(status: number, exception: unknown, requestId: string): ProblemDetails {
  const category = problemCategories[status];
  const title = category?.title ?? STATUS_CODES[status] ?? 'Error';
  // Only client errors may echo the exception message; a 5xx message can expose internals.
  const clientMessage = status < 500 ? readClientMessage(exception) : undefined;
  // Nest's default messages only repeat the status text ("Forbidden"); the category detail says more.
  const hasOwnMessage = clientMessage !== undefined && clientMessage !== STATUS_CODES[status];

  return {
    type: category ? `${PROBLEM_TYPE_BASE_URI}${category.slug}` : 'about:blank',
    title,
    status,
    detail: hasOwnMessage ? clientMessage : (category?.detail ?? title),
    instance: `urn:uuid:${requestId}`,
  };
}

function resolveStatus(exception: unknown): number {
  if (exception instanceof HttpException) {
    return exception.getStatus();
  }

  // Errors from the "http-errors" library (for example, body-parser's 413) carry their own 4xx statusCode.
  const statusCode = (exception as { statusCode?: unknown } | null | undefined)?.statusCode;

  return typeof statusCode === 'number' && Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 500
    ? statusCode
    : 500;
}

function readClientMessage(exception: unknown): string | undefined {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();

    return normalizeMessage(typeof response === 'string' ? response : (response as { message?: unknown }).message);
  }

  const { message, expose } = (exception ?? {}) as { message?: unknown; expose?: unknown };

  // "http-errors" sets expose=false when the message must not reach the client.
  return expose === false ? undefined : normalizeMessage(message);
}

function normalizeMessage(message: unknown): string | undefined {
  if (typeof message === 'string' && message !== '') {
    return message;
  }

  if (Array.isArray(message)) {
    const parts = message.filter((part): part is string => typeof part === 'string' && part !== '');

    return parts.length > 0 ? parts.join('; ') : undefined;
  }

  return undefined;
}
