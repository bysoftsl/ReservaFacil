import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { STAY_TRANSITION_PORT } from './application/ports/out/stay-transition.port';
import { ChangeStayStateUseCase } from './application/use-cases/change-stay-state.use-case';
import { StayTransitionAdapter } from './infrastructure/adapters/domain/stay-transition.adapter';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate(env: Record<string, unknown>): Record<string, unknown> {
        const rawPort = env.PORT ?? '3000';
        const port = typeof rawPort === 'string' && /^\d+$/.test(rawPort) ? Number(rawPort) : NaN;

        if (!Number.isInteger(port) || port < 1 || port > 65_535) {
          throw new Error('PORT must be an integer between 1 and 65535.');
        }

        return { ...env, PORT: port };
      },
    }),
  ],
  controllers: [AppController],
  providers: [ChangeStayStateUseCase, { provide: STAY_TRANSITION_PORT, useClass: StayTransitionAdapter }],
})
export class AppModule {}
