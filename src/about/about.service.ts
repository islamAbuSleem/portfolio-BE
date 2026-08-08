import { Injectable } from '@nestjs/common';
import { About } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OwnerResolverService } from '../common/services/owner-resolver.service';
import { UpdateAboutDto } from './dto/update-about.dto';

@Injectable()
export class AboutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly owner: OwnerResolverService,
  ) {}

  /** Public — the portfolio owner's About entry (null until created). */
  async find(): Promise<About | null> {
    const userId = await this.owner.firstUserId();
    if (!userId) {
      return null;
    }
    return this.prisma.about.findFirst({ where: { userId } });
  }

  /** Auth — creates on first edit, updates afterwards (1:1 with the owner). */
  async update(userId: string, dto: UpdateAboutDto): Promise<About> {
    return this.prisma.about.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto },
    });
  }
}
