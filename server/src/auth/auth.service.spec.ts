import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { hash } from 'argon2';
import { Role } from '../generated/prisma/enums.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const safeUser = {
    id: '0b0efc56-bf47-4fab-b57e-8c03834cc479',
    email: 'alice@demo.edu',
    name: 'Alice',
    role: Role.STUDENT,
    trustScore: 50,
  };

  function makeService(overrides: Record<string, unknown> = {}) {
    const prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn().mockResolvedValue(safeUser),
        ...overrides,
      },
    };
    const jwt = { signAsync: vi.fn().mockResolvedValue('signed.jwt') };
    return {
      service: new AuthService(
        prisma as unknown as PrismaService,
        jwt as never,
      ),
      prisma,
    };
  }

  it('registers students and never accepts a role from input', async () => {
    const { service, prisma } = makeService({
      findUnique: vi.fn().mockResolvedValue(null),
    });

    const result = await service.register({
      email: ' Alice@Demo.edu ',
      password: 'DemoPass123!',
      name: 'Alice',
    });

    expect(result).toEqual({ accessToken: 'signed.jwt', user: safeUser });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'alice@demo.edu' }),
      }),
    );
    expect(prisma.user.create.mock.calls[0][0].data.role).toBeUndefined();
  });

  it('rejects a duplicate email', async () => {
    const { service } = makeService({
      findUnique: vi.fn().mockResolvedValue(safeUser),
    });
    await expect(
      service.register({
        email: safeUser.email,
        password: 'DemoPass123!',
        name: safeUser.name,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with a valid password without returning its hash', async () => {
    const passwordHash = await hash('DemoPass123!');
    const { service } = makeService({
      findUnique: vi.fn().mockResolvedValue({ ...safeUser, passwordHash }),
    });

    const result = await service.login({
      email: safeUser.email,
      password: 'DemoPass123!',
    });
    expect(result.user).toEqual(safeUser);
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('uses one generic error for unknown users and bad passwords', async () => {
    const { service } = makeService({
      findUnique: vi.fn().mockResolvedValue(null),
    });
    await expect(
      service.login({ email: 'nobody@demo.edu', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
