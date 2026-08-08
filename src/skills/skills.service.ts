import { Injectable } from '@nestjs/common';
import { Prisma, Skill } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OwnerResolverService } from '../common/services/owner-resolver.service';
import { BaseContentService } from '../common/services/base-content.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Injectable()
export class SkillsService extends BaseContentService<
  Skill,
  CreateSkillDto,
  UpdateSkillDto
> {
  constructor(prisma: PrismaService, owner: OwnerResolverService) {
    super(prisma, owner, {
      findMany: (args) => prisma.skill.findMany(args),
      create: (args) => prisma.skill.create(args),
      findUnique: (args) => prisma.skill.findUnique(args),
      update: (args) => prisma.skill.update(args),
      deleteMany: (args) => prisma.skill.deleteMany(args),
      count: (args) => prisma.skill.count(args),
    });
  }

  protected updateOrder(
    tx: Prisma.TransactionClient,
    userId: string,
    id: string,
    order: number,
  ): Promise<{ count: number }> {
    return tx.skill.updateMany({ where: { id, userId }, data: { order } });
  }
}
