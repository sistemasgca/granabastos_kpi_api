import { describe, expect, it, vi } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: vi.fn(),
  } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  const createContext = (role: UserRole) =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: '709ef035-9500-43ba-8aca-cdcf86434b14',
            email: 'user@example.com',
            name: 'User',
            role,
          },
        }),
      }),
    }) as unknown as ExecutionContext;

  it('allows a role declared on the route', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([UserRole.EDITOR]);

    expect(guard.canActivate(createContext(UserRole.EDITOR))).toBe(true);
  });

  it('rejects a role not declared on the route', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue([UserRole.ADMIN]);

    expect(() => guard.canActivate(createContext(UserRole.EDITOR))).toThrow(
      ForbiddenException,
    );
  });
});
