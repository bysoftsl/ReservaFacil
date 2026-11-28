export interface AuthConfig {
  readonly jwtSecret: string;
  readonly jwtExpiresInSeconds: number;
}

const MIN_JWT_SECRET_LENGTH = 32;
const DURATION = /^(\d+)([smhd]?)$/;
const SECONDS_PER_UNIT: Readonly<Record<string, number>> = { '': 1, s: 1, m: 60, h: 3_600, d: 86_400 };

export function parseAuthConfig(env: Readonly<Record<string, unknown>>): AuthConfig {
  const jwtSecret = env.JWT_SECRET;

  if (typeof jwtSecret !== 'string' || jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be set to at least ${MIN_JWT_SECRET_LENGTH} characters.`);
  }

  // The 1h default is provisional until PA-010 defines the token lifetime (docs/spec.md).
  const rawExpiresIn = env.JWT_EXPIRES_IN ?? '1h';
  const match = typeof rawExpiresIn === 'string' ? DURATION.exec(rawExpiresIn) : null;
  const jwtExpiresInSeconds = match ? Number(match[1]) * SECONDS_PER_UNIT[match[2]] : NaN;

  if (!Number.isSafeInteger(jwtExpiresInSeconds) || jwtExpiresInSeconds <= 0) {
    throw new Error('JWT_EXPIRES_IN must be a positive number of seconds, optionally suffixed with s, m, h or d.');
  }

  return { jwtSecret, jwtExpiresInSeconds };
}
