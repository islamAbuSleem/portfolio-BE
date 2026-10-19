import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

const logger = new Logger('EmailService');

/**
 * The canonical, publicly reachable frontend URL. FRONTEND_URL may hold a
 * comma-separated CORS allow-list, so it cannot be used to build links.
 */
function getAppUrl(): string {
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) return appUrl.replace(/\/+$/, '');

  // Fall back to the first entry of the allow-list.
  const first = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)[0];

  return first ?? '';
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const port = Number(process.env.SMTP_PORT);

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.isFinite(port) ? port : 587,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
  }

  async sendLoginLink(email: string, token: string) {
    const appUrl = getAppUrl();

    if (!appUrl) {
      throw new Error(
        'APP_URL (or FRONTEND_URL) must be set to build the magic link.',
      );
    }

    const link = `${appUrl}/admin/verify?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Login to your Portfolio Admin',
      html: `
        <p>Click the link below to log in:</p>
        <a href="${link}">${link}</a>
        <p>This link expires in 15 minutes.</p>
        <p>If you didn't request this email, you can safely ignore it.</p>
      `,
    });

    logger.log(`Magic link sent to ${email}`);
  }
}
