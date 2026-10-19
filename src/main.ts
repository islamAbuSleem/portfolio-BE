import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

const logger = new Logger('Bootstrap');

/**
 * FRONTEND_URL may hold a comma-separated list of allowed origins, e.g.
 * "https://portfolio.workers.dev,http://localhost:3000".
 * Trailing slashes are stripped so the values can be compared verbatim
 * against the `Origin` request header.
 */
export function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin.length > 0);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());

  const isProduction = process.env.NODE_ENV === 'production';

  // Render sits behind a reverse proxy. Trusting one hop lets Express read
  // X-Forwarded-Proto, which is what makes `secure` cookies work over HTTPS.
  app.set(
    'trust proxy',
    Number(process.env.TRUST_PROXY ?? (isProduction ? 1 : 0)),
  );

  const allowedOrigins = parseAllowedOrigins(process.env.FRONTEND_URL);

  app.enableCors({
    // Resolved per request so a request from an unknown origin is rejected
    // instead of being answered with a wildcard.
    origin: (origin, callback) => {
      // No Origin header: same-origin navigation, curl, or a server-to-server
      // call. These are not subject to CORS.
      if (!origin) return callback(null, true);

      // Nothing configured -> deny every cross-origin request.
      if (allowedOrigins.length === 0) return callback(null, false);

      const normalized = origin.replace(/\/+$/, '');
      callback(null, allowedOrigins.includes(normalized));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Lets the process close Prisma connections cleanly before Render restarts
  // or replaces it, so a cold start never fails on a half-open pool.
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');

  logger.log(
    `Portfolio API listening on http://0.0.0.0:${port} [${isProduction ? 'production' : 'development'}]`,
  );
  logger.log(
    `CORS allowed origins: ${
      allowedOrigins.length > 0
        ? allowedOrigins.join(', ')
        : 'none (cross-origin requests denied)'
    }`,
  );
}

void bootstrap();
