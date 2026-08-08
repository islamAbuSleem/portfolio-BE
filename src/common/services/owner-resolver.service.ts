import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OwnerResolverService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the id of the first registered user — the single portfolio owner.
   * Content is scoped to this user for every public read.
   */
  async firstUserId(): Promise<string | null> {
    const first = await this.prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    return first?.id ?? null;
  }
}
