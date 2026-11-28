import { BadRequestException, Body, Controller, Header, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import type { LoginCommand } from '../../application/use-cases/login.use-case';

export interface LoginResponse {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async login(@Body() body: unknown): Promise<LoginResponse> {
    const result = await this.loginUseCase.execute(toLoginCommand(body));

    if (!result.ok) {
      // Same answer for an unknown account, an inactive one or a wrong password (docs/spec.md, RF-001).
      throw new BadRequestException('Credenciales no válidas.');
    }

    return { accessToken: result.accessToken, tokenType: 'Bearer', expiresIn: result.expiresInSeconds };
  }
}

function toLoginCommand(body: unknown): LoginCommand {
  const { username, password } = (body ?? {}) as { username?: unknown; password?: unknown };

  if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
    throw new BadRequestException("Los campos 'username' y 'password' son obligatorios y deben ser texto no vacío.");
  }

  return { username, password };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}
