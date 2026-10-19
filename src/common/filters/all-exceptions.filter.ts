import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/** Statuses at or above this are server errors (5xx). */
const HTTP_STATUS_SERVER_ERROR = 500;

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
  path?: string;
  timestamp: string;
}

/**
 * Catches everything that escapes a controller, logs it with the right
 * severity, and guarantees that internal details (stack traces, driver
 * messages, connection strings) never reach the client in production.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isProduction = process.env.NODE_ENV === 'production';
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const method = req.method;
    const url = req.originalUrl ?? req.url;

    if (status >= HTTP_STATUS_SERVER_ERROR) {
      this.logger.error(
        `${method} ${url} -> ${status} ${this.describe(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${method} ${url} -> ${status} ${this.describe(exception)}`,
      );
    }

    if (res.headersSent) return;

    const body: ErrorBody = {
      statusCode: status,
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    };

    if (isHttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        body.message = response;
      } else if (response && typeof response === 'object') {
        const record = response as Record<string, unknown>;
        const message = record.message;

        body.message = Array.isArray(message)
          ? message.map((entry) => String(entry))
          : typeof message === 'string'
            ? message
            : exception.message;

        if (typeof record.error === 'string') body.error = record.error;
      }
    } else if (!isProduction) {
      // Surfacing the raw message in development is what makes local
      // debugging fast; in production it would leak internals.
      body.message = this.describe(exception);
    }

    res.status(status).json(body);
  }

  private describe(exception: unknown): string {
    if (exception instanceof Error) return exception.message;
    if (typeof exception === 'string') return exception;
    return 'Unknown error';
  }
}
