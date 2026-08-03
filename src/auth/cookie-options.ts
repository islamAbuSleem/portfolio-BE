import { CookieOptions } from 'express';

export function getCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN,
  };
}
