import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';

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
})
export class AppModule {}
