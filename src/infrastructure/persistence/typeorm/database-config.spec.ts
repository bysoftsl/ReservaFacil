import { describe, expect, it } from '@jest/globals';
import { parseDatabaseConfig } from './database-config';

const validEnv = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '3307',
  DB_NAME: 'reservafacil',
  DB_USER: 'app',
  DB_PASSWORD: 'secret',
};

describe('parseDatabaseConfig', () => {
  it('maps the DB_* variables to a typed configuration', () => {
    expect(parseDatabaseConfig(validEnv)).toEqual({
      host: '127.0.0.1',
      port: 3307,
      database: 'reservafacil',
      username: 'app',
      password: 'secret',
    });
  });

  it('defaults the port to 3306 and accepts an empty password', () => {
    const env: Record<string, unknown> = { ...validEnv, DB_PASSWORD: '' };
    delete env.DB_PORT;

    expect(parseDatabaseConfig(env)).toMatchObject({ port: 3306, password: '' });
  });

  it.each(['DB_HOST', 'DB_USER', 'DB_NAME', 'DB_PASSWORD'])('rejects a missing %s', (name) => {
    const env: Record<string, unknown> = { ...validEnv };
    delete env[name];

    expect(() => parseDatabaseConfig(env)).toThrow(`${name} must be set.`);
  });

  it.each(['0', '65536', '33.06', 'abc', ''])('rejects the invalid port "%s"', (port) => {
    expect(() => parseDatabaseConfig({ ...validEnv, DB_PORT: port })).toThrow(
      'DB_PORT must be an integer between 1 and 65535.',
    );
  });
});
