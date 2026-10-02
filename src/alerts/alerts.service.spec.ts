import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertsService } from './alerts.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AlertsService', () => {
  let service: AlertsService;
  const prisma = {
    kpi: { findMany: vi.fn() },
    kpiTask: { findMany: vi.fn() },
    actionPlan: { findMany: vi.fn() },
    areaTask: { findMany: vi.fn() },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    prisma.kpi.findMany.mockResolvedValue([]);
    prisma.kpiTask.findMany.mockResolvedValue([]);
    prisma.actionPlan.findMany.mockResolvedValue([]);
    prisma.areaTask.findMany.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns an empty list when there are no KPIs or pending work', async () => {
    await expect(service.findAll()).resolves.toEqual([]);
  });
});
