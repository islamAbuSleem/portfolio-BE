import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendLoginLink(email: string, token: string) {
    const link = `${process.env.FRONTEND_URL}/admin/verify?token=${token}`;

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Login to your Portfolio Admin',
      html: `
        <p>Click the link below to log in:</p>
        <a href="${link}">${link}</a>
        <p>This link expires in 15 minutes.</p>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });
  }
}
