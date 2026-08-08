import { Injectable } from '@nestjs/common';
import { Prisma, Experience } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OwnerResolverService } from '../common/services/owner-resolver.service';
import { BaseContentService } from '../common/services/base-content.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

@Injectable()
export class ExperienceService extends BaseContentService<
  Experience,
  CreateExperienceDto,
  UpdateExperienceDto
> {
  constructor(prisma: PrismaService, owner: OwnerResolverService) {
    super(prisma, owner, {
      findMany: (args) => prisma.experience.findMany(args),
      create: (args) => prisma.experience.create(args),
      findUnique: (args) => prisma.experience.findUnique(args),
      update: (args) => prisma.experience.update(args),
      deleteMany: (args) => prisma.experience.deleteMany(args),
      count: (args) => prisma.experience.count(args),
    });
  }

  protected updateOrder(
    tx: Prisma.TransactionClient,
    userId: string,
    id: string,
    order: number,
  ): Promise<{ count: number }> {
    return tx.experience.updateMany({ where: { id, userId }, data: { order } });
  }
}
