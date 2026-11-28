import type { StaffRole } from '../../../domain/stay-state-machine';

export const ACCESS_TOKEN_ISSUER_PORT = Symbol('ACCESS_TOKEN_ISSUER_PORT');

export interface AccessTokenClaims {
  readonly subject: string;
  readonly role: StaffRole;
}

export interface IssuedAccessToken {
  readonly accessToken: string;
  readonly expiresInSeconds: number;
}

export interface AccessTokenIssuerPort {
  issue(claims: AccessTokenClaims): Promise<IssuedAccessToken>;
}
