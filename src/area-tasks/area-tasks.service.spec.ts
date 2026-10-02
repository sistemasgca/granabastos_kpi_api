import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AreaTasksService } from './area-tasks.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AreaTasksService', () => {
  let service: AreaTasksService;
  const prisma = {
    kpi: { findUnique: vi.fn() },
    areaTask: {
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
        AreaTasksService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AreaTasksService>(AreaTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects a linked KPI that does not exist', async () => {
    prisma.kpi.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        code: 'POA-CAL-01',
        area: 'Calidad',
        processName: 'Encuestas',
        activity: 'Aplicar encuesta trimestral',
        responsible: 'Calidad',
        responsibleEmail: 'calidad@example.com',
        quarter: 'T4',
        year: 2026,
        startDate: '2026-10-01',
        dueDate: '2026-12-01',
        progress: 0,
        deliverables: 'Informe de resultados',
        linkedKpiId: '3c3d9a24-4595-4e53-a6f3-f14da7df9911',
      }),
    ).rejects.toThrow('No existe el KPI');
    expect(prisma.areaTask.create).not.toHaveBeenCalled();
  });
});
