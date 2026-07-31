import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './email.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { User } from './dto/user.dto';
import { LoginDto } from './dto/login.dto';
import { MagicLinkDto } from './dto/magic-link.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
    const existUser: User | null | undefined =
      await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
    if (existUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        about: {
          create: {
            bio: '',
          },
        },
      },
    });
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return { accessToken };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Email or Password is incorrect');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('No password set for this account');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email or password is incorrect');
    }
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return { accessToken };
  }

  async requestMagicLink(dto: MagicLinkDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      return { message: 'a link has been sent' };
    }

    const token = uuidv4();
    await this.prisma.magicToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });
    await this.emailService.sendLoginLink(user.email, token);
    return { message: 'a link has been sent' };
  }

  async verifyMagicLink(token: string): Promise<{ accessToken: string }> {
    const magicToken = await this.prisma.magicToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!magicToken || magicToken.used || magicToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    await this.prisma.magicToken.update({
      where: { id: magicToken.id },
      data: { used: true },
    });

    const accessToken = this.jwtService.sign({
      sub: magicToken.user.id,
      email: magicToken.user.email,
    });

    return { accessToken };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: { orderBy: { order: 'asc' } },
        experience: { orderBy: { order: 'asc' } },
        projects: { orderBy: { order: 'asc' } },
      },
    });
  }
}
