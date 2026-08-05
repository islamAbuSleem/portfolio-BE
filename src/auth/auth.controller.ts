import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MagicLinkDto } from './dto/magic-link.dto';
import { Response } from 'express';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { getCookieOptions } from './cookie-options';
import { CurrentUserId } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken } = await this.authService.register(dto);

    res.cookie('access_token', accessToken, getCookieOptions());

    return { message: 'Registered successfully' };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken } = await this.authService.login(dto);

    res.cookie('access_token', accessToken, getCookieOptions());

    return { message: 'Logged in' };
  }

  @Post('magic-link')
  async requestMagicLink(@Body() dto: MagicLinkDto) {
    return this.authService.requestMagicLink(dto);
  }

  @Post('verify-magic-link')
  async verifyMagicLink(
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken } = await this.authService.verifyMagicLink(token);

    res.cookie('access_token', accessToken, getCookieOptions());

    return { message: 'Logged in via magic link' };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', getCookieOptions());
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@CurrentUserId() userId: string) {
    return this.authService.getMe(userId);
  }
}
