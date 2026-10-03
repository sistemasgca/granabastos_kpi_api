import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActionStatus, Quarter } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAreaTaskDto } from './dto/create-area-task.dto.js';
import { UpdateAreaTaskDto } from './dto/update-area-task.dto.js';

const areaTaskInclude = {
  linkedKpi: {
    select: { id: true, code: true, name: true },
  },
} as const;
const validQuarters: Quarter[] = [
  Quarter.T1,
  Quarter.T2,
  Quarter.T3,
  Quarter.T4,
];

@Injectable()
export class AreaTasksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters: { area?: string; year?: string; quarter?: string }) {
    const year = this.parseYear(filters.year);
    const quarter = this.parseQuarter(filters.quarter);

    return this.prisma.areaTask.findMany({
      where: {
        area: filters.area,
        year,
        quarter,
      },
      include: areaTaskInclude,
      orderBy: [{ year: 'desc' }, { quarter: 'asc' }, { dueDate: 'asc' }],
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.areaTask.findUnique({
      where: { id },
      include: areaTaskInclude,
    });
    if (!task) throw new NotFoundException(`No existe la actividad POA ${id}.`);
    return task;
  }

  async create(dto: CreateAreaTaskDto) {
    this.ensureDateRange(dto.startDate, dto.dueDate);
    if (dto.linkedKpiId) await this.ensureKpiExists(dto.linkedKpiId);

    return this.prisma.areaTask.create({
      data: {
        code: dto.code,
        area: dto.area,
        processName: dto.processName,
        activity: dto.activity,
        responsible: dto.responsible,
        responsibleEmail: dto.responsibleEmail,
        quarter: dto.quarter,
        year: dto.year,
        startDate: new Date(dto.startDate),
        dueDate: new Date(dto.dueDate),
        progress: dto.progress,
        status: this.determineStatus(dto.dueDate, dto.progress),
        deliverables: dto.deliverables,
        linkedKpiId: dto.linkedKpiId ?? null,
        observations: dto.observations,
        evidenceUrl: dto.evidenceUrl,
      },
      include: areaTaskInclude,
    });
  }

  async update(id: string, dto: UpdateAreaTaskDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Debe enviar al menos un campo para actualizar.');
    }
    const current = await this.findOne(id);
    if (dto.linkedKpiId) await this.ensureKpiExists(dto.linkedKpiId);

    const startDate = dto.startDate ?? this.dateOnly(current.startDate);
    const dueDate = dto.dueDate ?? this.dateOnly(current.dueDate);
    const progress = dto.progress ?? current.progress;
    this.ensureDateRange(startDate, dueDate);

    return this.prisma.areaTask.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: this.determineStatus(dueDate, progress),
      },
      include: areaTaskInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.areaTask.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async ensureKpiExists(kpiId: string) {
    const kpi = await this.prisma.kpi.findUnique({
      where: { id: kpiId },
      select: { id: true },
    });
    if (!kpi) throw new NotFoundException(`No existe el KPI ${kpiId}.`);
  }

  private ensureDateRange(startDate: string, dueDate: string) {
    if (startDate > dueDate) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser posterior a la fecha límite.',
      );
    }
  }

  private determineStatus(dueDate: string, progress: number): ActionStatus {
    if (progress >= 100) return ActionStatus.COMPLETADA;
    if (dueDate < this.today()) return ActionStatus.RETRASADA;
    if (progress > 0) return ActionStatus.EN_PROGRESO;
    return ActionStatus.PENDIENTE;
  }

  private parseYear(value?: string): number | undefined {
    if (value === undefined) return undefined;
    const year = Number(value);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new BadRequestException('El filtro year debe ser un año entre 2000 y 2100.');
    }
    return year;
  }

  private parseQuarter(value?: string): Quarter | undefined {
    if (value === undefined) return undefined;
    const quarter = validQuarters.find((candidate) => candidate === value);
    if (!quarter) {
      throw new BadRequestException('El filtro quarter debe ser T1, T2, T3 o T4.');
    }
    return quarter;
  }

  private dateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
