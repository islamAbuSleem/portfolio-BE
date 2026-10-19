import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liveness probe used as the Render health check path.
   * Deliberately does not touch the database: a cold Neon compute must never
   * make Render consider the service unhealthy and restart it.
   */
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'portfolio-api',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe. Verifies the database round-trip so a broken connection
   * surfaces as a 503 instead of a confusing 500 on real traffic.
   */
  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response) {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'reachable',
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      };
    } catch {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return {
        status: 'degraded',
        database: 'unreachable',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
