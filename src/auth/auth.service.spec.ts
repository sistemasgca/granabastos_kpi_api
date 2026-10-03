import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  };
  const jwt = { signAsync: vi.fn() };
  const config = { get: vi.fn(() => '15m') };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('normalizes email and returns a signed token without the password hash', async () => {
    const passwordHash = await bcrypt.hash('SecurePass123!', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: '709ef035-9500-43ba-8aca-cdcf86434b14',
      email: 'admin@example.com',
      name: 'Admin',
      role: UserRole.ADMIN,
      isActive: true,
      passwordHash,
    });
    jwt.signAsync.mockResolvedValue('signed.jwt.token');

    const result = await service.login({
      email: ' ADMIN@example.com ',
      password: 'SecurePass123!',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@example.com' },
    });
    expect(result).toMatchObject({
      accessToken: 'signed.jwt.token',
      tokenType: 'Bearer',
      expiresIn: '15m',
      user: { email: 'admin@example.com', role: UserRole.ADMIN },
    });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects incorrect credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'wrongpass' }),
    ).rejects.toThrow('Correo o contraseña incorrectos.');
  });
});
