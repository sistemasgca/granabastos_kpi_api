import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KpiDirection, KpiStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateKpiDto } from './dto/CreateKpiDto.js';
import { UpdateKpiDto } from './dto/UpdateKpiDto.js';

@Injectable()
export class KpisService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.kpi.findMany({
      orderBy: [{ area: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(id: string) {
    const kpi = await this.prisma.kpi.findUnique({ where: { id } });
    if (!kpi) throw new NotFoundException(`No existe el KPI ${id}.`);
    return kpi;
  }

  async create(dto: CreateKpiDto) {
    const existing = await this.prisma.kpi.findUnique({
      where: { code: dto.code },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un KPI con el código ${dto.code}.`);
    }

    const compliancePercentage = this.calculateCompliance(
      dto.currentValue,
      dto.targetValue,
      dto.direction,
    );

    return this.prisma.kpi.create({
      data: {
        code: dto.code,
        name: dto.name,
        objective: dto.objective,
        area: dto.area,
        targetValue: dto.targetValue,
        currentValue: dto.currentValue,
        unit: dto.unit,
        direction: dto.direction,
        compliancePercentage,
        responsible: dto.responsible,
        responsibleEmail: dto.responsibleEmail,
        periodicity: dto.periodicity,
        lastUpdated: dto.lastUpdated
          ? new Date(dto.lastUpdated)
          : new Date(),
        status: this.determineStatus(compliancePercentage),
      },
    });
  }

  async update(id: string, dto: UpdateKpiDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Debe enviar al menos un campo para actualizar.',
      );
    }
    const current = await this.findOne(id);
    const targetValue = dto.targetValue ?? Number(current.targetValue);
    const currentValue = dto.currentValue ?? Number(current.currentValue);
    const direction = dto.direction ?? current.direction;
    const compliancePercentage = this.calculateCompliance(
      currentValue,
      targetValue,
      direction,
    );

    return this.prisma.kpi.update({
      where: { id },
      data: {
        ...dto,
        lastUpdated: dto.lastUpdated
          ? new Date(dto.lastUpdated)
          : undefined,
        compliancePercentage,
        status: this.determineStatus(compliancePercentage),
      },
    });
  }

  private calculateCompliance(
    current: number,
    target: number,
    direction: KpiDirection,
  ): number {
    if (target === 0) return 100;
    if (direction === KpiDirection.higher_is_better) {
      return Math.round((current / target) * 10_000) / 100;
    }
    if (current === 0) return 100;
    return Math.round((target / current) * 10_000) / 100;
  }

  private determineStatus(compliance: number): KpiStatus {
    if (compliance >= 100) return KpiStatus.SUPERADO;
    if (compliance >= 90) return KpiStatus.EN_META;
    if (compliance >= 70) return KpiStatus.EN_RIESGO;
    return KpiStatus.CRITICO;
  }
}
