import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const logger = new Logger('PrismaService');

const CONNECT_ATTEMPTS = 3;
const CONNECT_RETRY_DELAY_MS = 2000;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not set. Configure it in the Render dashboard (or your .env file) before starting the service.',
      );
    }

    const adapter = new PrismaPg({
      connectionString,
      // The free tier of Render runs a single instance, so a small pool is
      // enough and keeps the connection count under Neon's limits.
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      connectionTimeoutMillis: Number(
        process.env.DATABASE_CONNECT_TIMEOUT_MS ?? 10000,
      ),
      idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS ?? 30000),
    });

    super({ adapter });
  }

  async onModuleInit() {
    // A cold Neon compute can refuse the first connection while it resumes.
    // Retrying keeps Render from turning that into a crash loop; the service
    // still starts and /health/ready reports the real state.
    for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt++) {
      try {
        await this.$connect();
        logger.log('Connected to PostgreSQL');
        return;
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);

        if (attempt === CONNECT_ATTEMPTS) {
          logger.error(
            `Could not connect to PostgreSQL after ${CONNECT_ATTEMPTS} attempts: ${reason}. ` +
              'The API is running but database routes will fail until the connection succeeds.',
          );
          return;
        }

        logger.warn(
          `Database connection attempt ${attempt}/${CONNECT_ATTEMPTS} failed: ${reason}. Retrying...`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, CONNECT_RETRY_DELAY_MS * attempt),
        );
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
