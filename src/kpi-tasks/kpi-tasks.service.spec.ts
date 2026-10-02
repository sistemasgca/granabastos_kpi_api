import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KpiTasksService } from './kpi-tasks.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('KpiTasksService', () => {
  let service: KpiTasksService;
  const prisma = {
    kpi: { findUnique: vi.fn() },
    kpiTask: {
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
        KpiTasksService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<KpiTasksService>(KpiTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('filters tasks by KPI id', async () => {
    prisma.kpiTask.findMany.mockResolvedValue([]);

    await service.findAll('3c3d9a24-4595-4e53-a6f3-f14da7df9911');

    expect(prisma.kpiTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { kpiId: '3c3d9a24-4595-4e53-a6f3-f14da7df9911' },
      }),
    );
  });

  it('rejects a task when its KPI does not exist', async () => {
    prisma.kpi.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        kpiId: '3c3d9a24-4595-4e53-a6f3-f14da7df9911',
        stepNumber: 1,
        title: 'Aplicar encuesta',
        description: 'Encuestar a los clientes',
        scheduledFrequency: 'Trimestral',
        dueDate: '2026-12-01',
        responsible: 'Calidad',
      }),
    ).rejects.toThrow('No existe el KPI');
    expect(prisma.kpiTask.create).not.toHaveBeenCalled();
  });
});
