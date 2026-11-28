import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../dist/app.module.js';
import { configureHttpApp } from '../../dist/interfaces/http/configure-http-app.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('GET /health responds with the application status over HTTP, outside the API prefix', async (t) => {
  const app = await NestFactory.create(AppModule, { logger: false });
  t.after(() => app.close());
  configureHttpApp(app);
  await app.listen(0, '127.0.0.1');

  const response = await fetch(`${await app.getUrl()}/health`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('x-request-id') ?? '', UUID_V4);
  assert.deepEqual(await response.json(), { status: 'ok' });
});
