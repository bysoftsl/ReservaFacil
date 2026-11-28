import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../dist/app.module.js';
import { configureHttpApp } from '../../dist/interfaces/http/configure-http-app.js';

// Needs the database and JWT settings from .env; it only reads from the database.
test('POST /api/v1/auth/login is mapped under the API prefix and rejects unknown accounts generically', async (t) => {
  const app = await NestFactory.create(AppModule, { logger: false });
  t.after(() => app.close());
  configureHttpApp(app);
  await app.listen(0, '127.0.0.1');
  const baseUrl = await app.getUrl();
  const login = (path) =>
    fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: `missing-${randomUUID()}`, password: 'not-the-password' }),
    });

  const response = await login('/api/v1/auth/login');
  assert.equal(response.status, 400);
  assert.match(response.headers.get('content-type') ?? '', /^application\/problem\+json\b/);

  const problem = await response.json();
  assert.equal(problem.type, 'https://api.reservafacil.example/problemas/solicitud-invalida');
  assert.equal(problem.detail, 'Credenciales no válidas.');

  assert.equal((await login('/auth/login')).status, 404);
});
