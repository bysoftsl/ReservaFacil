import { describe, expect, it, jest } from '@jest/globals';
import type { AccessTokenIssuerPort } from '../ports/out/access-token-issuer.port';
import type { PasswordHasherPort } from '../ports/out/password-hasher.port';
import type { StaffCredentials, StaffCredentialsPort } from '../ports/out/staff-credentials.port';
import { LoginUseCase } from './login.use-case';

const admin: StaffCredentials = { id: '7', role: 'administrador', passwordHash: '$2b$10$stored', active: true };

function createLogin(staff: StaffCredentials | null, passwordMatches: boolean) {
  const findByUsername = jest.fn<StaffCredentialsPort['findByUsername']>().mockResolvedValue(staff);
  const verify = jest.fn<PasswordHasherPort['verify']>().mockResolvedValue(passwordMatches);
  const issue = jest
    .fn<AccessTokenIssuerPort['issue']>()
    .mockResolvedValue({ accessToken: 'signed.jwt', expiresInSeconds: 3600 });

  return { useCase: new LoginUseCase({ findByUsername }, { verify }, { issue }), findByUsername, verify, issue };
}

describe('LoginUseCase', () => {
  it('issues an access token with the account id and role when the password matches', async () => {
    const { useCase, findByUsername, verify, issue } = createLogin(admin, true);

    await expect(useCase.execute({ username: 'admin', password: 'admin123' })).resolves.toEqual({
      ok: true,
      accessToken: 'signed.jwt',
      expiresInSeconds: 3600,
    });
    expect(findByUsername).toHaveBeenCalledWith('admin');
    expect(verify).toHaveBeenCalledWith('admin123', admin.passwordHash);
    expect(issue).toHaveBeenCalledWith({ subject: '7', role: 'administrador' });
  });

  it.each<{ name: string; staff: StaffCredentials | null; passwordMatches: boolean }>([
    { name: 'an unknown account', staff: null, passwordMatches: false },
    { name: 'a wrong password', staff: admin, passwordMatches: false },
    { name: 'an inactive account', staff: { ...admin, active: false }, passwordMatches: true },
  ])('rejects $name with the same reason, after checking the password', async ({ staff, passwordMatches }) => {
    const { useCase, verify, issue } = createLogin(staff, passwordMatches);

    await expect(useCase.execute({ username: 'admin', password: 'admin123' })).resolves.toEqual({
      ok: false,
      reason: 'invalid_credentials',
    });
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith('admin123', staff?.passwordHash);
    expect(issue).not.toHaveBeenCalled();
  });
});
