import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { AuthService } from './auth.service';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-token') }));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: Record<string, jest.Mock>;
    magicToken: Record<string, jest.Mock>;
  };
  let jwt: { sign: jest.Mock };
  let email: { sendLoginLink: jest.Mock };

  const user = {
    id: 'user-1',
    email: 'a@b.com',
    passwordHash: '$2b$10$valid.hash.example',
    name: 'A',
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      magicToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    jwt = { sign: jest.fn().mockReturnValue('token') };
    email = { sendLoginLink: jest.fn() };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      email as unknown as EmailService,
    );
  });

  describe('register', () => {
    it('rejects duplicate emails', async () => {
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(
        service.register({ email: user.email, password: '123456', name: 'A' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates the user with a hashed password and returns a token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(user);

      const result = await service.register({
        email: user.email,
        password: '123456',
        name: 'A',
      });

      expect(result.accessToken).toBe('token');
      const createData = prisma.user.create.mock.calls[0][0].data;
      expect(createData.passwordHash).not.toBe('123456');
      expect(createData.passwordHash).toMatch(/^\$2[ab]\$/);
    });
  });

  describe('login', () => {
    it('rejects unknown emails', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nope@b.com', password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects accounts without a password set', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...user,
        passwordHash: null,
      });

      await expect(
        service.login({ email: user.email, password: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects wrong passwords', async () => {
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(
        service.login({ email: user.email, password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('magic link', () => {
    it('creates a 15-minute token and sends the email', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.magicToken.create.mockResolvedValue({});

      const result = await service.requestMagicLink({ email: user.email });

      const tokenData = prisma.magicToken.create.mock.calls[0][0].data;
      expect(result.message).toBe('a link has been sent');
      expect(tokenData.userId).toBe(user.id);
      expect(tokenData.expiresAt.getTime() - Date.now()).toBeGreaterThan(
        14 * 60 * 1000,
      );
      expect(email.sendLoginLink).toHaveBeenCalledWith(
        user.email,
        tokenData.token,
      );
    });

    it('never reveals whether an email exists', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.requestMagicLink({ email: user.email });

      expect(result.message).toBe('a link has been sent');
      expect(prisma.magicToken.create).not.toHaveBeenCalled();
    });

    it('rejects used tokens', async () => {
      prisma.magicToken.findUnique.mockResolvedValue({
        id: 't1',
        used: true,
        expiresAt: new Date(Date.now() + 60_000),
        user,
      });

      await expect(service.verifyMagicLink('stale')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects expired tokens and consumes valid ones only once', async () => {
      prisma.magicToken.findUnique.mockResolvedValue({
        id: 't1',
        used: false,
        expiresAt: new Date(Date.now() - 60_000),
        user,
      });

      await expect(service.verifyMagicLink('old')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.magicToken.update).not.toHaveBeenCalled();
    });
  });
});
