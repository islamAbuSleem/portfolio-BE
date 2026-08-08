import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OwnerResolverService } from './owner-resolver.service';
import { ReorderItemDto } from '../dto/reorder.dto';

/**
 * Narrow prisma delegate contract used by the base service.
 * Each content service composes its own typed delegate, so ownership
 * checks stay in the query arguments (single source of truth).
 */
export interface ContentDelegate<TEntity, TCreate, TUpdate> {
  findMany(args: {
    where: { userId: string };
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }];
  }): Promise<TEntity[]>;
  create(args: {
    data: TCreate & { userId: string; order: number };
  }): Promise<TEntity>;
  findUnique(args: {
    where: { id: string; userId: string };
  }): Promise<TEntity | null>;
  update(args: { where: { id: string }; data: TUpdate }): Promise<TEntity>;
  deleteMany(args: {
    where: { id: string; userId: string };
  }): Promise<{ count: number }>;
  count(args: { where: { userId: string } }): Promise<number>;
}

@Injectable()
export abstract class BaseContentService<TEntity, TCreate, TUpdate> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly owner: OwnerResolverService,
    protected readonly delegate: ContentDelegate<TEntity, TCreate, TUpdate>,
  ) {}

  /** Public — returns all content of the portfolio owner, ordered. */
  async findAll(): Promise<TEntity[]> {
    const userId = await this.owner.firstUserId();
    if (!userId) {
      return [];
    }
    return this.delegate.findMany({
      where: { userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async count(): Promise<number> {
    const userId = await this.owner.firstUserId();
    if (!userId) {
      return 0;
    }
    return this.delegate.count({ where: { userId } });
  }

  async create(userId: string, dto: TCreate): Promise<TEntity> {
    return this.delegate.create({
      data: { ...dto, order: 0, userId },
    });
  }

  /** Ownership-aware lookup — throws 404 when missing or not owned. */
  protected async getOwned(userId: string, id: string): Promise<TEntity> {
    const entity = await this.delegate.findUnique({ where: { id, userId } });
    if (!entity) {
      throw new NotFoundException(`Resource ${id} not found`);
    }
    return entity;
  }

  async update(userId: string, id: string, dto: TUpdate): Promise<TEntity> {
    await this.getOwned(userId, id);
    return this.delegate.update({ where: { id }, data: dto });
  }

  /** Ordered writes applied in one transaction, ownership-filtered. */
  async updateMany(userId: string, items: ReorderItemDto[]): Promise<void> {
    if (items.length === 0) {
      return;
    }
    await this.prisma.$transaction(async (tx) => {
      for (const { id, order } of items) {
        await this.updateOrder(tx, userId, id, order);
      }
    });
  }

  /** Concrete service maps this to its entity's ordered write on the tx client. */
  protected abstract updateOrder(
    tx: Prisma.TransactionClient,
    userId: string,
    id: string,
    order: number,
  ): Promise<{ count: number }>;

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwned(userId, id);
    const { count } = await this.delegate.deleteMany({ where: { id, userId } });
    if (count === 0) {
      throw new NotFoundException(`Resource ${id} not found`);
    }
  }
}
