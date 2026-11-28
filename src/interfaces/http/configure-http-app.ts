import type { INestApplication } from '@nestjs/common';

/** HTTP setup shared by main.ts and the tests, so that both expose the same routes. */
export function configureHttpApp(app: INestApplication): void {
  // /health stays outside the versioned API so that health probes do not change between API versions.
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
}
