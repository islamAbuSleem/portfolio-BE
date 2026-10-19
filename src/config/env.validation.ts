import { Logger } from '@nestjs/common';

const logger = new Logger('EnvValidation');

const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_URL',
] as const;

/**
 * Fails fast when a production boot is missing a variable the app cannot
 * work without, and only warns everywhere else so local development and CI
 * are never blocked by an incomplete .env file.
 */
export function validateEnv(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const isProduction = raw.NODE_ENV === 'production';
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => {
    const value = raw[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missing.length === 0) return raw;

  if (isProduction) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        `Set them in the Render dashboard (or your .env file) before starting the service.`,
    );
  }

  logger.warn(
    `Missing environment variable(s): ${missing.join(', ')}. ` +
      `The app will start but protected routes and the database will not work.`,
  );

  return raw;
}
