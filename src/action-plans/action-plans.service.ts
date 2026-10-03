import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActionStatus } from '@prisma/client';
import { isUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.js';
import { CreateActionPlanDto } from './dto/create-action-plan.dto.js';
import { UpdateActionPlanDto } from './dto/update-action-plan.dto.js';

const actionInclude = {
  kpi: {
    select: { id: true, code: true, name: true },
  },
} as const;

@Injectable()
export class ActionPlansService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(kpiId?: string) {
    if (kpiId && !isUUID(kpiId)) {
      throw new BadRequestException('El filtro kpiId debe ser un UUID válido.');
    }
    return this.prisma.actionPlan.findMany({
      where: kpiId ? { kpiId } : undefined,
      include: actionInclude,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.actionPlan.findUnique({
      where: { id },
      include: actionInclude,
    });
    if (!plan) throw new NotFoundException(`No existe el plan de acción ${id}.`);
    return plan;
  }

  async create(dto: CreateActionPlanDto, user: AuthenticatedUser) {
    await this.ensureKpiExists(dto.kpiId);
    this.ensureDateRange(dto.startDate, dto.dueDate);

    return this.prisma.actionPlan.create({
      data: {
        code: dto.code,
        kpiId: dto.kpiId,
        name: dto.name,
        activity: dto.activity,
        responsible: dto.responsible,
        responsibleEmail: dto.responsibleEmail,
        startDate: new Date(dto.startDate),
        dueDate: new Date(dto.dueDate),
        progress: dto.progress,
        status: this.determineStatus(dto.dueDate, dto.progress),
        createdById: user.id,
        updatedById: user.id,
        observations: dto.observations,
        evidenceUrl: dto.evidenceUrl,
        evidenceNotes: dto.evidenceNotes,
      },
      include: actionInclude,
    });
  }

  async update(
    id: string,
    dto: UpdateActionPlanDto,
    user: AuthenticatedUser,
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Debe enviar al menos un campo para actualizar.');
    }
    const current = await this.findOne(id);
    if (dto.kpiId) await this.ensureKpiExists(dto.kpiId);

    const startDate = dto.startDate ?? this.dateOnly(current.startDate);
    const dueDate = dto.dueDate ?? this.dateOnly(current.dueDate);
    const progress = dto.progress ?? current.progress;
    this.ensureDateRange(startDate, dueDate);

    return this.prisma.actionPlan.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: this.determineStatus(dueDate, progress),
        updatedById: user.id,
      },
      include: actionInclude,
    });
  }

  async remove(id: string, _user: AuthenticatedUser) {
    await this.findOne(id);
    await this.prisma.actionPlan.delete({ where: { id } });
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

  private dateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
