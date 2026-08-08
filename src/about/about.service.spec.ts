import { PrismaService } from '../prisma/prisma.service';
import { OwnerResolverService } from '../common/services/owner-resolver.service';
import { AboutService } from './about.service';
import { UpdateAboutDto } from './dto/update-about.dto';

describe('AboutService', () => {
  let service: AboutService;
  let prisma: { about: Record<string, jest.Mock> };
  let owner: OwnerResolverService;

  const userId = 'user-1';
  const about = {
    id: 'about-1',
    bio: 'Hello',
    avatarUrl: null,
    resumeUrl: null,
    userId,
  };
  const dto: UpdateAboutDto = { bio: 'Hello' };

  beforeEach(() => {
    prisma = {
      about: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
    };
    owner = { firstUserId: jest.fn() } as unknown as OwnerResolverService;
    service = new AboutService(prisma as unknown as PrismaService, owner);
  });

  describe('find (public)', () => {
    it('returns the owner about entry', async () => {
      (owner.firstUserId as jest.Mock).mockResolvedValue(userId);
      prisma.about.findFirst.mockResolvedValue(about);

      await expect(service.find()).resolves.toEqual(about);
      expect(prisma.about.findFirst).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('returns null without an owner', async () => {
      (owner.firstUserId as jest.Mock).mockResolvedValue(null);

      await expect(service.find()).resolves.toBeNull();
      expect(prisma.about.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('update (auth)', () => {
    it('creates on first save and updates after (upsert both branches)', async () => {
      prisma.about.upsert.mockResolvedValue(about);

      await service.update(userId, dto);

      expect(prisma.about.upsert).toHaveBeenCalledWith({
        where: { userId },
        create: { userId, ...dto },
        update: { ...dto },
      });
    });
  });
});
