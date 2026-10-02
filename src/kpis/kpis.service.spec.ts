import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KpisService } from './kpis.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('KpisService', () => {
  let service: KpisService;
  const prisma = {
    kpi: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpisService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<KpisService>(KpisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('calculates KPI compliance and status on creation', async () => {
    prisma.kpi.findUnique.mockResolvedValue(null);
    prisma.kpi.create.mockImplementation(({ data }) => Promise.resolve(data));

    const result = await service.create({
      code: 'KPI-CAL-01',
      name: 'Satisfacción',
      objective: 'Mejorar el servicio',
      area: 'Calidad',
      targetValue: 90,
      currentValue: 81,
      unit: '%',
      direction: 'higher_is_better',
      responsible: 'Calidad',
      responsibleEmail: 'calidad@example.com',
      periodicity: 'TRIMESTRAL',
    });

    expect(result.compliancePercentage).toBe(90);
    expect(result.status).toBe('EN_META');
  });
});
