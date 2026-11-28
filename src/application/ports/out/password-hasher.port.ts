export const PASSWORD_HASHER_PORT = Symbol('PASSWORD_HASHER_PORT');

export interface PasswordHasherPort {
  /**
   * Resolves `true` only when the password matches the hash. Without a hash it still does the same work and resolves
   * `false`, so the response time does not reveal whether the account exists.
   */
  verify(plainPassword: string, passwordHash: string | undefined): Promise<boolean>;
}
