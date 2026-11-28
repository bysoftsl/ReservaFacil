import { Inject, Injectable } from '@nestjs/common';
import { ACCESS_TOKEN_ISSUER_PORT } from '../ports/out/access-token-issuer.port';
import type { AccessTokenIssuerPort } from '../ports/out/access-token-issuer.port';
import { PASSWORD_HASHER_PORT } from '../ports/out/password-hasher.port';
import type { PasswordHasherPort } from '../ports/out/password-hasher.port';
import { STAFF_CREDENTIALS_PORT } from '../ports/out/staff-credentials.port';
import type { StaffCredentialsPort } from '../ports/out/staff-credentials.port';

export interface LoginCommand {
  readonly username: string;
  readonly password: string;
}

export type LoginResult =
  | { readonly ok: true; readonly accessToken: string; readonly expiresInSeconds: number }
  | { readonly ok: false; readonly reason: 'invalid_credentials' };

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(STAFF_CREDENTIALS_PORT) private readonly staffCredentials: StaffCredentialsPort,
    @Inject(PASSWORD_HASHER_PORT) private readonly passwordHasher: PasswordHasherPort,
    @Inject(ACCESS_TOKEN_ISSUER_PORT) private readonly accessTokenIssuer: AccessTokenIssuerPort,
  ) {}

  async execute({ username, password }: LoginCommand): Promise<LoginResult> {
    const staff = await this.staffCredentials.findByUsername(username);
    // Always verified, so an unknown or inactive account takes as long as a wrong password (docs/spec.md, RF-001).
    const passwordMatches = await this.passwordHasher.verify(password, staff?.passwordHash);

    if (!staff || !staff.active || !passwordMatches) {
      return { ok: false, reason: 'invalid_credentials' };
    }

    const { accessToken, expiresInSeconds } = await this.accessTokenIssuer.issue({
      subject: staff.id,
      role: staff.role,
    });

    return { ok: true, accessToken, expiresInSeconds };
  }
}
