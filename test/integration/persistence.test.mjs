import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../dist/app.module.js';
import { AvailabilityGuard } from '../../dist/infrastructure/persistence/typeorm/entities/availability-guard.entity.js';
import { StaffUser } from '../../dist/infrastructure/persistence/typeorm/entities/staff-user.entity.js';

// Needs the database from .env with the schema created by `npm run migration:run`.
test('the migrated schema matches the TypeORM entities', async (t) => {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  t.after(() => app.close());
  const dataSource = app.get(DataSource);

  const guards = await dataSource.getRepository(AvailabilityGuard).find();
  assert.deepEqual(
    guards.map(({ id }) => id),
    ['1'],
  );

  // Selects every mapped column, so a missing or renamed column fails here.
  const users = await dataSource.getRepository(StaffUser).find({ take: 1 });
  assert.ok(Array.isArray(users));
});
