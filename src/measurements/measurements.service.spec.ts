import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KpiDirection, KpiStatus, UserRole } from '@prisma/client';
import { MeasurementsService } from './measurements.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('MeasurementsService', () => {
  let service: MeasurementsService;
  const transaction = {
    measurement: { create: vi.fn() },
    kpi: { update: vi.fn() },
  };
  const prisma = {
    kpi: { findUnique: vi.fn() },
    measurement: { findMany: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn((callback) => callback(transaction)),
  };
  const actor = {
    id: '709ef035-9500-43ba-8aca-cdcf86434b14',
    email: 'editor@example.com',
    name: 'Editor',
    role: UserRole.EDITOR,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeasurementsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MeasurementsService>(MeasurementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('calculates formula, compliance, and updates KPI atomically', async () => {
    const kpiId = '3c3d9a24-4595-4e53-a6f3-f14da7df9911';
    prisma.kpi.findUnique.mockResolvedValue({
      id: kpiId,
      code: 'KPI-CAL-01',
      targetValue: 88,
      direction: KpiDirection.higher_is_better,
    });
    transaction.measurement.create.mockImplementation(({ data }) =>
      Promise.resolve(data),
    );
    transaction.kpi.update.mockResolvedValue({});

    const result = await service.create(
      {
        kpiId,
        quarter: 'T1',
        year: 2026,
        date: '2026-03-31',
        inputA: 43,
        inputB: 50,
      },
      actor,
    );

    expect(result).toMatchObject({
      value: 86,
      targetQuarter: 86,
      compliancePercentage: 100,
      createdById: actor.id,
      registeredBy: actor.name,
    });
    expect(transaction.kpi.update).toHaveBeenCalledWith({
      where: { id: kpiId },
      data: {
        currentValue: 86,
        lastUpdated: new Date('2026-03-31T00:00:00.000Z'),
        compliancePercentage: 100,
        status: KpiStatus.SUPERADO,
      },
    });
  });

  it('requires formula inputs instead of accepting a client result', async () => {
    prisma.kpi.findUnique.mockResolvedValue({
      id: '3c3d9a24-4595-4e53-a6f3-f14da7df9911',
      code: 'KPI-CAL-01',
      targetValue: 88,
      direction: KpiDirection.higher_is_better,
    });

    await expect(
      service.create(
        {
          kpiId: '3c3d9a24-4595-4e53-a6f3-f14da7df9911',
          quarter: 'T1',
          year: 2026,
          date: '2026-03-31',
          value: 99,
        },
        actor,
      ),
    ).rejects.toThrow('requiere inputA e inputB');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
