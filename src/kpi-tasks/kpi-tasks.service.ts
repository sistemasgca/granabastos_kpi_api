import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateKpiTaskDto } from './dto/create-kpi-task.dto.js';
import { UpdateKpiTaskDto } from './dto/update-kpi-task.dto.js';

const taskInclude = {
  kpi: {
    select: { id: true, code: true, name: true },
  },
} as const;

@Injectable()
export class KpiTasksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(kpiId?: string) {
    if (kpiId && !isUUID(kpiId)) {
      throw new BadRequestException('El filtro kpiId debe ser un UUID válido.');
    }
    return this.prisma.kpiTask.findMany({
      where: kpiId ? { kpiId } : undefined,
      include: taskInclude,
      orderBy: [{ dueDate: 'asc' }, { stepNumber: 'asc' }],
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.kpiTask.findUnique({
      where: { id },
      include: taskInclude,
    });
    if (!task) throw new NotFoundException(`No existe la tarea KPI ${id}.`);
    return task;
  }

  async create(dto: CreateKpiTaskDto) {
    await this.ensureKpiExists(dto.kpiId);
    return this.prisma.kpiTask.create({
      data: {
        kpiId: dto.kpiId,
        stepNumber: dto.stepNumber,
        title: dto.title,
        description: dto.description,
        scheduledFrequency: dto.scheduledFrequency,
        scheduledMonth: dto.scheduledMonth,
        dueDate: new Date(dto.dueDate),
        completedDate: dto.completedDate ? new Date(dto.completedDate) : undefined,
        responsible: dto.responsible,
        status: dto.status ?? 'Pendiente',
        observations: dto.observations,
      },
      include: taskInclude,
    });
  }

  async update(id: string, dto: UpdateKpiTaskDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Debe enviar al menos un campo para actualizar.');
    }
    await this.findOne(id);
    if (dto.kpiId) await this.ensureKpiExists(dto.kpiId);

    return this.prisma.kpiTask.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        completedDate:
          dto.completedDate === null
            ? null
            : dto.completedDate
              ? new Date(dto.completedDate)
              : undefined,
      },
      include: taskInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.kpiTask.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async ensureKpiExists(kpiId: string) {
    const kpi = await this.prisma.kpi.findUnique({
      where: { id: kpiId },
      select: { id: true },
    });
    if (!kpi) throw new NotFoundException(`No existe el KPI ${kpiId}.`);
  }
}
