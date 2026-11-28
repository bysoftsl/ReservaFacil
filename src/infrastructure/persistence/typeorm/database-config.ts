export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
}

export function parseDatabaseConfig(env: Readonly<Record<string, unknown>>): DatabaseConfig {
  const rawPort = env.DB_PORT ?? '3306';
  const port = typeof rawPort === 'string' && /^\d+$/.test(rawPort) ? Number(rawPort) : NaN;

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('DB_PORT must be an integer between 1 and 65535.');
  }

  return {
    host: requiredString(env, 'DB_HOST'),
    port,
    username: requiredString(env, 'DB_USER'),
    // A local account may have an empty password, but the variable must still be defined.
    password: requiredString(env, 'DB_PASSWORD', { allowEmpty: true }),
    database: requiredString(env, 'DB_NAME'),
  };
}

function requiredString(
  env: Readonly<Record<string, unknown>>,
  name: string,
  options?: { allowEmpty: boolean },
): string {
  const value = env[name];

  if (typeof value !== 'string' || (value === '' && !options?.allowEmpty)) {
    throw new Error(`${name} must be set.`);
  }

  return value;
}
