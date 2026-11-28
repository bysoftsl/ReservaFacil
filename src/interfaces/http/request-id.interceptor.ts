import { randomUUID } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';

export const REQUEST_ID_HEADER = 'X-Request-Id';

// The API always generates the id: an X-Request-Id sent by the client is never read or reused.
// Guards, the router and body parsing can fail before any interceptor runs, so the exception filter calls this too.
export function ensureRequestId(response: ServerResponse): string {
  const current = response.getHeader(REQUEST_ID_HEADER);

  if (typeof current === 'string') {
    return current;
  }

  const requestId = randomUUID();

  if (!response.headersSent) {
    response.setHeader(REQUEST_ID_HEADER, requestId);
  }

  return requestId;
}

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    ensureRequestId(context.switchToHttp().getResponse<ServerResponse>());

    return next.handle();
  }
}
