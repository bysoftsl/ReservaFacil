import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../dist/app.module.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('an unknown route answers with an RFC 9457 problem document tied to X-Request-Id', async (t) => {
  const app = await NestFactory.create(AppModule, { logger: false });
  t.after(() => app.close());
  await app.listen(0, '127.0.0.1');

  const response = await fetch(`${await app.getUrl()}/does-not-exist`);
  const requestId = response.headers.get('x-request-id');

  assert.equal(response.status, 404);
  assert.match(response.headers.get('content-type') ?? '', /^application\/problem\+json\b/);
  assert.match(requestId ?? '', UUID_V4);

  const problem = await response.json();
  assert.equal(problem.type, 'https://api.reservafacil.example/problemas/recurso-no-encontrado');
  assert.equal(problem.status, 404);
  assert.equal(problem.instance, `urn:uuid:${requestId}`);
});
