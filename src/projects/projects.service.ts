import { Injectable } from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OwnerResolverService } from '../common/services/owner-resolver.service';
import { BaseContentService } from '../common/services/base-content.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService extends BaseContentService<
  Project,
  CreateProjectDto,
  UpdateProjectDto
> {
  constructor(prisma: PrismaService, owner: OwnerResolverService) {
    super(prisma, owner, {
      findMany: (args) => prisma.project.findMany(args),
      create: (args) => prisma.project.create(args),
      findUnique: (args) => prisma.project.findUnique(args),
      update: (args) => prisma.project.update(args),
      deleteMany: (args) => prisma.project.deleteMany(args),
      count: (args) => prisma.project.count(args),
    });
  }

  protected updateOrder(
    tx: Prisma.TransactionClient,
    userId: string,
    id: string,
    order: number,
  ): Promise<{ count: number }> {
    return tx.project.updateMany({ where: { id, userId }, data: { order } });
  }
}
