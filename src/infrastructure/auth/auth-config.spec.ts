import { describe, expect, it } from '@jest/globals';
import { parseAuthConfig } from './auth-config';

const JWT_SECRET = 's'.repeat(32);

describe('parseAuthConfig', () => {
  it('defaults the token lifetime to 1h', () => {
    expect(parseAuthConfig({ JWT_SECRET })).toEqual({ jwtSecret: JWT_SECRET, jwtExpiresInSeconds: 3_600 });
  });

  it.each([
    ['900', 900],
    ['30s', 30],
    ['15m', 900],
    ['8h', 28_800],
    ['1d', 86_400],
  ])('reads JWT_EXPIRES_IN "%s" as %i seconds', (value, seconds) => {
    expect(parseAuthConfig({ JWT_SECRET, JWT_EXPIRES_IN: value }).jwtExpiresInSeconds).toBe(seconds);
  });

  it.each(['', '0', '0h', '1w', '1.5h', '-1h', '1 h'])('rejects the invalid lifetime "%s"', (value) => {
    expect(() => parseAuthConfig({ JWT_SECRET, JWT_EXPIRES_IN: value })).toThrow('JWT_EXPIRES_IN must be');
  });

  it.each([undefined, 's'.repeat(31)])('rejects a missing or short JWT_SECRET', (secret) => {
    expect(() => parseAuthConfig({ JWT_SECRET: secret })).toThrow('JWT_SECRET must be set to at least 32 characters.');
  });
});
