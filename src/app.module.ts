import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { STAY_TRANSITION_PORT } from './application/ports/out/stay-transition.port';
import { ChangeStayStateUseCase } from './application/use-cases/change-stay-state.use-case';
import { StayTransitionAdapter } from './infrastructure/adapters/domain/stay-transition.adapter';
import { createDataSourceOptions } from './infrastructure/persistence/typeorm/data-source-options';
import { parseDatabaseConfig } from './infrastructure/persistence/typeorm/database-config';
import { ProblemDetailsFilter } from './interfaces/http/problem-details.filter';
import { RequestIdInterceptor } from './interfaces/http/request-id.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate(env: Record<string, unknown>): Record<string, unknown> {
        const rawPort = env.PORT ?? '3000';
        const port = typeof rawPort === 'string' && /^\d+$/.test(rawPort) ? Number(rawPort) : NaN;

        if (!Number.isInteger(port) || port < 1 || port > 65_535) {
          throw new Error('PORT must be an integer between 1 and 65535.');
        }

        const database = parseDatabaseConfig(env);

        return { ...env, PORT: port, DB_PORT: database.port };
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createDataSourceOptions({
          host: config.getOrThrow<string>('DB_HOST'),
          port: config.getOrThrow<number>('DB_PORT'),
          username: config.getOrThrow<string>('DB_USER'),
          password: config.getOrThrow<string>('DB_PASSWORD'),
          database: config.getOrThrow<string>('DB_NAME'),
        }),
    }),
  ],
  controllers: [AppController],
  providers: [
    ChangeStayStateUseCase,
    { provide: STAY_TRANSITION_PORT, useClass: StayTransitionAdapter },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
  ],
})
export class AppModule {}
