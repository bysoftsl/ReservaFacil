import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from './data-source-options';
import { parseDatabaseConfig } from './database-config';

// The TypeORM CLI does not load .env; variables already in the environment take precedence.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

// The CLI requires exactly one DataSource export in this file.
export default new DataSource(createDataSourceOptions(parseDatabaseConfig(process.env)));
