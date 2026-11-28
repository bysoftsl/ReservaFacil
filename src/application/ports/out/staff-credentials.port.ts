import type { StaffRole } from '../../../domain/stay-state-machine';

export const STAFF_CREDENTIALS_PORT = Symbol('STAFF_CREDENTIALS_PORT');

export interface StaffCredentials {
  readonly id: string;
  readonly role: StaffRole;
  readonly passwordHash: string;
  readonly active: boolean;
}

export interface StaffCredentialsPort {
  findByUsername(username: string): Promise<StaffCredentials | null>;
}
