import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  AccessTokenClaims,
  AccessTokenIssuerPort,
  IssuedAccessToken,
} from '../../application/ports/out/access-token-issuer.port';

@Injectable()
export class JwtAccessTokenIssuer implements AccessTokenIssuerPort {
  constructor(private readonly jwt: JwtService) {}

  async issue({ subject, role }: AccessTokenClaims): Promise<IssuedAccessToken> {
    // Algorithm, secret and lifetime come from the JwtModule options (src/infrastructure/auth/auth.module.ts).
    const accessToken = await this.jwt.signAsync({ sub: subject, role });
    const { iat, exp } = this.jwt.decode<{ iat: number; exp: number }>(accessToken);

    return { accessToken, expiresInSeconds: exp - iat };
  }
}
