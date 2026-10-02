import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionPlansService } from './action-plans.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserRole } from '@prisma/client';

describe('ActionPlansService', () => {
  let service: ActionPlansService;
  const actor = {
    id: '709ef035-9500-43ba-8aca-cdcf86434b14',
    email: 'admin@example.com',
    name: 'Admin',
    role: UserRole.ADMIN,
  };
  const prisma = {
    kpi: { findUnique: vi.fn() },
    actionPlan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionPlansService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ActionPlansService>(ActionPlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('derives the initial status from progress and due date', async () => {
    const kpiId = '3c3d9a24-4595-4e53-a6f3-f14da7df9911';
    prisma.kpi.findUnique.mockResolvedValue({ id: kpiId });
    prisma.actionPlan.create.mockImplementation(({ data }) =>
      Promise.resolve(data),
    );

    await service.create({
      code: 'PLA-CAL-01',
      kpiId,
      name: 'Mejorar satisfacción',
      activity: 'Ejecutar acciones',
      responsible: 'Calidad',
      responsibleEmail: 'calidad@example.com',
      startDate: '2026-10-01',
      dueDate: '2026-12-01',
      progress: 0,
    }, actor);

    expect(prisma.actionPlan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDIENTE' }),
      }),
    );
  });

  it('rejects a plan whose start date is after its due date', async () => {
    const kpiId = '3c3d9a24-4595-4e53-a6f3-f14da7df9911';
    prisma.kpi.findUnique.mockResolvedValue({ id: kpiId });

    await expect(
      service.create({
        code: 'PLA-CAL-01',
        kpiId,
        name: 'Mejorar satisfacción',
        activity: 'Ejecutar acciones',
        responsible: 'Calidad',
        responsibleEmail: 'calidad@example.com',
        startDate: '2026-12-02',
        dueDate: '2026-12-01',
        progress: 0,
      }, actor),
    ).rejects.toThrow('La fecha de inicio no puede ser posterior');
    expect(prisma.actionPlan.create).not.toHaveBeenCalled();
  });
});
