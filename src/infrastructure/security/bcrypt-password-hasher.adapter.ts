import { Injectable } from '@nestjs/common';
import { compare } from 'bcrypt';
import type { PasswordHasherPort } from '../../application/ports/out/password-hasher.port';

// bcrypt hash of a random value that was discarded. Its cost (10) must match the stored hashes (see
// src/scripts/seed-admin.ts) so that checking an unknown account takes as long as checking a real one.
const DECOY_PASSWORD_HASH = '$2b$10$kcI0DaZpWpv2d4X/cLco9OmULD2pMPuv52yEu6Na/g1wz4KycMAQe';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasherPort {
  async verify(plainPassword: string, passwordHash: string | undefined): Promise<boolean> {
    const matches = await compare(plainPassword, passwordHash ?? DECOY_PASSWORD_HASH);

    return passwordHash !== undefined && matches;
  }
}
