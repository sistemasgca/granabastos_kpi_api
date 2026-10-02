import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KpiDirection, KpiStatus, Quarter } from '@prisma/client';
import { isUUID } from 'class-validator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMeasurementDto } from './dto/create-measurement.dto.js';

type Formula = (inputA: number, inputB: number) => number;

const formulas: Record<string, Formula> = {
  'KPI-CAL-01': (a, b) => (b > 0 ? round2((a / b) * 100) : 0),
  'KPI-FIN-02': (a, b) => (b > 0 ? round2((a / b) * 100) : 0),
  'KPI-COM-03': (a, b) => (b > 0 ? round2((a / b) * 100) : 0),
  'KPI-OPE-04': (a, b) => round1(a + b),
  'KPI-AMB-05': (a, b) => (b > 0 ? round2((a / b) * 100) : 0),
};

const quarterlyTargets: Record<string, Record<number, Record<Quarter, number>>> = {
  'KPI-CAL-01': {
    2024: { T1: 78, T2: 79.5, T3: 80, T4: 81 },
    2025: { T1: 82, T2: 83, T3: 84, T4: 85 },
    2026: { T1: 86, T2: 88, T3: 88, T4: 89 },
    2027: { T1: 90, T2: 91, T3: 92, T4: 93 },
    2028: { T1: 93.5, T2: 94, T3: 94.5, T4: 95 },
  },
  'KPI-FIN-02': {
    2024: { T1: 6.8, T2: 6.4, T3: 6, T4: 5.5 },
    2025: { T1: 5.5, T2: 5.2, T3: 5, T4: 4.8 },
    2026: { T1: 5, T2: 4.8, T3: 4.5, T4: 4 },
    2027: { T1: 4, T2: 3.8, T3: 3.5, T4: 3.2 },
    2028: { T1: 3.2, T2: 3, T3: 2.9, T4: 2.8 },
  },
  'KPI-COM-03': {
    2024: { T1: 90, T2: 91, T3: 92, T4: 93 },
    2025: { T1: 93, T2: 93.5, T3: 94, T4: 94.5 },
    2026: { T1: 94, T2: 95, T3: 95, T4: 95.5 },
    2027: { T1: 96, T2: 96.5, T3: 97, T4: 97.5 },
    2028: { T1: 98, T2: 98.2, T3: 98.5, T4: 98.5 },
  },
  'KPI-OPE-04': {
    2024: { T1: 94000, T2: 96000, T3: 98000, T4: 100000 },
    2025: { T1: 99000, T2: 100000, T3: 101000, T4: 103000 },
    2026: { T1: 103000, T2: 105000, T3: 105000, T4: 107000 },
    2027: { T1: 108000, T2: 110000, T3: 112000, T4: 115000 },
    2028: { T1: 116000, T2: 118000, T3: 119000, T4: 120000 },
  },
  'KPI-AMB-05': {
    2024: { T1: 48, T2: 50, T3: 52, T4: 55 },
    2025: { T1: 55, T2: 56.5, T3: 58, T4: 60 },
    2026: { T1: 62, T2: 65, T3: 65, T4: 68 },
    2027: { T1: 70, T2: 72, T3: 74, T4: 78 },
    2028: { T1: 78, T2: 80, T3: 81, T4: 82 },
  },
};

const measurementInclude = {
  kpi: { select: { id: true, code: true, name: true } },
  createdBy: { select: { id: true, email: true, name: true } },
  attachments: true,
} as const;

@Injectable()
export class MeasurementsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(kpiId?: string) {
    if (kpiId && !isUUID(kpiId)) {
      throw new BadRequestException('El filtro kpiId debe ser un UUID válido.');
    }
    return this.prisma.measurement.findMany({
      where: kpiId ? { kpiId } : undefined,
      include: measurementInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const measurement = await this.prisma.measurement.findUnique({
      where: { id },
      include: measurementInclude,
    });
    if (!measurement) {
      throw new NotFoundException(`No existe la medición ${id}.`);
    }
    return measurement;
  }

  async create(dto: CreateMeasurementDto, user: AuthenticatedUser) {
    const kpi = await this.prisma.kpi.findUnique({
      where: { id: dto.kpiId },
    });
    if (!kpi) {
      throw new NotFoundException(`No existe el KPI ${dto.kpiId}.`);
    }

    const formula = formulas[kpi.code];
    let value: number;
    if (formula) {
      if (dto.inputA === undefined || dto.inputB === undefined) {
        throw new BadRequestException(
          `El KPI ${kpi.code} requiere inputA e inputB para calcular el resultado.`,
        );
      }
      value = formula(dto.inputA, dto.inputB);
    } else {
      if (dto.value === undefined) {
        throw new BadRequestException(
          `El KPI ${kpi.code} no tiene fórmula registrada; envía value.`,
        );
      }
      value = dto.value;
    }

    const targetQuarter =
      quarterlyTargets[kpi.code]?.[dto.year]?.[dto.quarter] ??
      Number(kpi.targetValue);
    const compliancePercentage = this.calculateCompliance(
      value,
      targetQuarter,
      kpi.direction,
    );
    const status = this.determineStatus(compliancePercentage);
    const date = new Date(`${dto.date}T00:00:00.000Z`);

    return this.prisma.$transaction(async (transaction) => {
      const measurement = await transaction.measurement.create({
        data: {
          kpiId: kpi.id,
          quarter: dto.quarter,
          year: dto.year,
          date,
          targetQuarter,
          value,
          inputA: dto.inputA,
          inputB: dto.inputB,
          compliancePercentage,
          note: dto.note,
          registeredBy: user.name,
          createdById: user.id,
        },
        include: measurementInclude,
      });

      await transaction.kpi.update({
        where: { id: kpi.id },
        data: {
          currentValue: value,
          lastUpdated: date,
          compliancePercentage,
          status,
        },
      });

      return measurement;
    });
  }

  private calculateCompliance(
    current: number,
    target: number,
    direction: KpiDirection,
  ): number {
    if (target === 0) return 100;
    if (direction === KpiDirection.higher_is_better) {
      return round2((current / target) * 100);
    }
    if (current === 0) return 100;
    return round2((target / current) * 100);
  }

  private determineStatus(compliance: number): KpiStatus {
    if (compliance >= 100) return KpiStatus.SUPERADO;
    if (compliance >= 90) return KpiStatus.EN_META;
    if (compliance >= 70) return KpiStatus.EN_RIESGO;
    return KpiStatus.CRITICO;
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
