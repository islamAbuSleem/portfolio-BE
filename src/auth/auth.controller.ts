import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MagicLinkDto } from './dto/magic-link.dto';
import { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);

    const { accessToken } = await this.authService.login({
      email: dto.email,
      password: dto.password,
    });

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: process.env.COOKIE_DOMAIN,
    });

    return { message: 'Registered successfully', user: result };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken } = await this.authService.login(dto);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: process.env.COOKIE_DOMAIN,
    });

    return { message: 'Logged in' };
  }

  @Post('magic-link')
  async requestMagicLink(@Body() dto: MagicLinkDto) {
    return this.authService.requestMagicLink(dto);
  }

  @Post('verify-magic-link')
  async verifyMagicLink(@Query('token') token: string, @Res({ passthrough: true }) res: Response) {
    const { accessToken } = await this.authService.verifyMagicLink(token);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: process.env.COOKIE_DOMAIN,
    });

    return { message: 'Logged in via magic link' };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      domain: process.env.COOKIE_DOMAIN,
    });
    return { message: 'Logged out' };
  }

  @Get('me')
  async getMe(@Req() req: Request) {
    return this.authService.getMe((req as any).user.id);
  }
}