import {Injectable} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './email.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService,
              private readonly jwtService: JwtService,
              private readonly emailService: EmailService) {
  }

  async register(dto: RegisterDto): Promise<void> {

  }
}