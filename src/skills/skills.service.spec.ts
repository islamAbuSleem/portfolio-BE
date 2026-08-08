import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OwnerResolverService } from '../common/services/owner-resolver.service';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { SkillCategory } from '@prisma/client';

describe('SkillsService', () => {
  let service: SkillsService;
  let prisma: {
    skill: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };
  let owner: OwnerResolverService;

  const userId = 'user-1';
  const skillId = 'skill-1';
  const skill = {
    id: skillId,
    name: 'React',
    category: SkillCategory.Frontend,
    proficiency: 90,
    order: 0,
    userId,
  };
  const createDto: CreateSkillDto = {
    name: 'React',
    category: SkillCategory.Frontend,
    proficiency: 90,
  };

  beforeEach(() => {
    prisma = {
      skill: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    owner = { firstUserId: jest.fn() } as unknown as OwnerResolverService;
    service = new SkillsService(prisma as unknown as PrismaService, owner);
  });

  describe('findAll (public)', () => {
    it('returns owned skills ordered by order then createdAt', async () => {
      (owner.firstUserId as jest.Mock).mockResolvedValue(userId);
      prisma.skill.findMany.mockResolvedValue([skill]);

      const result = await service.findAll();

      expect(owner.firstUserId).toHaveBeenCalledTimes(1);
      expect(prisma.skill.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      });
      expect(result).toEqual([skill]);
    });

    it('returns an empty list when no owner exists', async () => {
      (owner.firstUserId as jest.Mock).mockResolvedValue(null);

      await expect(service.findAll()).resolves.toEqual([]);
      expect(prisma.skill.findMany).not.toHaveBeenCalled();
    });
  });

  describe('create (auth)', () => {
    it('forces order 0 and scopes the row to the owner', async () => {
      prisma.skill.create.mockResolvedValue(skill);

      await service.create(userId, createDto);

      expect(prisma.skill.create).toHaveBeenCalledWith({
        data: { ...createDto, order: 0, userId },
      });
    });
  });

  describe('update (auth)', () => {
    it('throws 404 when the skill is missing or not owned', async () => {
      prisma.skill.findUnique.mockResolvedValue(null);

      await expect(
        service.update(userId, skillId, { proficiency: 20 }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.skill.update).not.toHaveBeenCalled();
    });

    it('checks ownership before updating', async () => {
      prisma.skill.findUnique.mockResolvedValue(skill);
      prisma.skill.update.mockResolvedValue(skill);

      await service.update(userId, skillId, { proficiency: 20 });

      expect(prisma.skill.findUnique).toHaveBeenCalledWith({
        where: { id: skillId, userId },
      });
      expect(prisma.skill.update).toHaveBeenCalledWith({
        where: { id: skillId },
        data: { proficiency: 20 },
      });
    });
  });

  describe('updateMany (reorder, auth)', () => {
    it('applies reorder inside a transaction with ownership filters', async () => {
      const txUpdate = jest.fn().mockResolvedValue({ count: 1 });
      prisma.$transaction.mockImplementation(
        (cb: (tx: { skill: { updateMany: jest.Mock } }) => Promise<void>) =>
          cb({ skill: { updateMany: txUpdate } }),
      );

      await service.updateMany(userId, [
        { id: skillId, order: 3 },
        { id: 'skill-2', order: 1 },
      ]);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(txUpdate).toHaveBeenCalledWith({
        where: { id: skillId, userId },
        data: { order: 3 },
      });
      expect(txUpdate).toHaveBeenCalledWith({
        where: { id: 'skill-2', userId },
        data: { order: 1 },
      });
    });

    it('skips the transaction for an empty list', async () => {
      await service.updateMany(userId, []);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('remove (auth)', () => {
    it('deletes only when the row belongs to the caller', async () => {
      prisma.skill.findUnique.mockResolvedValue(skill);
      prisma.skill.deleteMany.mockResolvedValue({ count: 1 });

      await service.remove(userId, skillId);

      expect(prisma.skill.deleteMany).toHaveBeenCalledWith({
        where: { id: skillId, userId },
      });
    });

    it('throws NotFound when delete affected no rows', async () => {
      prisma.skill.findUnique.mockResolvedValue(skill);
      prisma.skill.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(userId, skillId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('count', () => {
    it('returns 0 without an owner', async () => {
      (owner.firstUserId as jest.Mock).mockResolvedValue(null);

      await expect(service.count()).resolves.toBe(0);
    });

    it('counts only owned rows', async () => {
      (owner.firstUserId as jest.Mock).mockResolvedValue(userId);
      prisma.skill.count.mockResolvedValue(5);

      await expect(service.count()).resolves.toBe(5);
      expect(prisma.skill.count).toHaveBeenCalledWith({ where: { userId } });
    });
  });
});
