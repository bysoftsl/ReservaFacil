import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import type { DatabaseConfig } from './database-config';
import { AvailabilityGuard } from './entities/availability-guard.entity';
import { StaffUser } from './entities/staff-user.entity';

export function createDataSourceOptions(database: DatabaseConfig): DataSourceOptions {
  return {
    type: 'mysql',
    host: database.host,
    port: database.port,
    username: database.username,
    password: database.password,
    database: database.database,
    charset: 'utf8mb4',
    timezone: 'Z',
    synchronize: false,
    entities: [StaffUser, AvailabilityGuard],
    // Compiled migrations next to this file; the TypeORM CLI and the application both run from dist.
    migrations: [join(__dirname, 'migrations', '*.js')],
  };
}
