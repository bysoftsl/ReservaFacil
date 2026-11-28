import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ACCESS_TOKEN_ISSUER_PORT } from '../../application/ports/out/access-token-issuer.port';
import { PASSWORD_HASHER_PORT } from '../../application/ports/out/password-hasher.port';
import { STAFF_CREDENTIALS_PORT } from '../../application/ports/out/staff-credentials.port';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { StaffUser } from '../persistence/typeorm/entities/staff-user.entity';
import { TypeOrmStaffCredentialsRepository } from '../persistence/typeorm/staff-credentials.repository';
import { BcryptPasswordHasher } from '../security/bcrypt-password-hasher.adapter';
import { JwtAccessTokenIssuer } from '../security/jwt-access-token-issuer.adapter';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([StaffUser]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      // JWT_SECRET and JWT_EXPIRES_IN (already in seconds) are validated at startup by AppModule.
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { algorithm: 'HS256', expiresIn: config.getOrThrow<number>('JWT_EXPIRES_IN') },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    { provide: STAFF_CREDENTIALS_PORT, useClass: TypeOrmStaffCredentialsRepository },
    { provide: PASSWORD_HASHER_PORT, useClass: BcryptPasswordHasher },
    { provide: ACCESS_TOKEN_ISSUER_PORT, useClass: JwtAccessTokenIssuer },
  ],
})
export class AuthModule {}
