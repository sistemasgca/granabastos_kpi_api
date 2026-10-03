import { Injectable } from '@nestjs/common';
import { KpiStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type AlertPriority = 'Alta' | 'Media';
type AlertTargetType = 'kpi' | 'action' | 'kpi_task' | 'area_task';

export interface AlertItem {
  id: string;
  type:
    | 'kpi_critical'
    | 'kpi_risk'
    | 'action_overdue'
    | 'action_due_soon'
    | 'kpi_outdated'
    | 'kpi_task_overdue';
  priority: AlertPriority;
  title: string;
  message: string;
  targetId: string;
  targetType: AlertTargetType;
  date: string;
  read: false;
}

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AlertItem[]> {
    const today = this.today();
    const cutoff90Days = this.addDays(today, -90);
    const soon15Days = this.addDays(today, 15);
    const soon30Days = this.addDays(today, 30);

    const [kpis, kpiTasks, actionPlans, areaTasks] = await Promise.all([
      this.prisma.kpi.findMany(),
      this.prisma.kpiTask.findMany({
        where: {
          status: { not: 'Completada' },
          dueDate: { lt: new Date(`${today}T00:00:00.000Z`) },
        },
        include: { kpi: { select: { code: true } } },
      }),
      this.prisma.actionPlan.findMany({
        where: { progress: { lt: 100 } },
        include: { kpi: { select: { code: true } } },
      }),
      this.prisma.areaTask.findMany({
        where: { progress: { lt: 100 } },
      }),
    ]);

    const alerts: AlertItem[] = [];

    for (const kpi of kpis) {
      const lastUpdated = this.dateOnly(kpi.lastUpdated);
      const compliance = Number(kpi.compliancePercentage);

      if (kpi.status === KpiStatus.CRITICO || compliance < 70) {
        alerts.push({
          id: `alert-kpi-crit-${kpi.id}`,
          type: 'kpi_critical',
          priority: 'Alta',
          title: `KPI crítico: ${kpi.code}`,
          message: `${kpi.name} tiene ${compliance.toFixed(1)}% de cumplimiento. Meta: ${kpi.targetValue} ${kpi.unit}; actual: ${kpi.currentValue} ${kpi.unit}. Responsable: ${kpi.responsible}.`,
          targetId: kpi.id,
          targetType: 'kpi',
          date: lastUpdated,
          read: false,
        });
      } else if (kpi.status === KpiStatus.EN_RIESGO || compliance < 90) {
        alerts.push({
          id: `alert-kpi-risk-${kpi.id}`,
          type: 'kpi_risk',
          priority: 'Media',
          title: `KPI en riesgo: ${kpi.code}`,
          message: `${kpi.name} está en ${compliance.toFixed(1)}% de cumplimiento, por debajo del umbral del 90%.`,
          targetId: kpi.id,
          targetType: 'kpi',
          date: lastUpdated,
          read: false,
        });
      }

      if (lastUpdated < cutoff90Days) {
        const daysSinceUpdate = this.daysBetween(lastUpdated, today);
        alerts.push({
          id: `alert-kpi-outdated-${kpi.id}`,
          type: 'kpi_outdated',
          priority: 'Media',
          title: `Corte trimestral pendiente: ${kpi.code}`,
          message: `El indicador "${kpi.name}" no registra medición desde hace ${daysSinceUpdate} días. Última actualización: ${lastUpdated}.`,
          targetId: kpi.id,
          targetType: 'kpi',
          date: lastUpdated,
          read: false,
        });
      }
    }

    for (const task of kpiTasks) {
      const dueDate = this.dateOnly(task.dueDate);
      alerts.push({
        id: `alert-kpi-task-overdue-${task.id}`,
        type: 'kpi_task_overdue',
        priority: 'Alta',
        title: `Tarea de medición retrasada: ${task.kpi.code}`,
        message: `"${task.title}" venció el ${dueDate}. Responsable: ${task.responsible}.`,
        targetId: task.id,
        targetType: 'kpi_task',
        date: dueDate,
        read: false,
      });
    }

    for (const action of actionPlans) {
      const alert = this.buildDueAlert({
        id: action.id,
        code: action.code,
        title: action.name,
        responsible: action.responsible,
        dueDate: this.dateOnly(action.dueDate),
        progress: action.progress,
        targetType: 'action',
        today,
        soon15Days,
        soon30Days,
        context: `KPI: ${action.kpi.code}`,
      });
      if (alert) alerts.push(alert);
    }

    for (const task of areaTasks) {
      const alert = this.buildDueAlert({
        id: task.id,
        code: task.code,
        title: task.activity,
        responsible: task.responsible,
        dueDate: this.dateOnly(task.dueDate),
        progress: task.progress,
        targetType: 'area_task',
        today,
        soon15Days,
        soon30Days,
        context: `Área: ${task.area}`,
      });
      if (alert) alerts.push(alert);
    }

    const priorityWeight: Record<AlertPriority, number> = { Alta: 2, Media: 1 };
    return alerts.sort(
      (a, b) => priorityWeight[b.priority] - priorityWeight[a.priority],
    );
  }

  private buildDueAlert(input: {
    id: string;
    code: string;
    title: string;
    responsible: string;
    dueDate: string;
    progress: number;
    targetType: 'action' | 'area_task';
    today: string;
    soon15Days: string;
    soon30Days: string;
    context: string;
  }): AlertItem | undefined {
    const {
      id,
      code,
      title,
      responsible,
      dueDate,
      progress,
      targetType,
      today,
      soon15Days,
      soon30Days,
      context,
    } = input;

    if (dueDate < today) {
      return {
        id: `alert-${targetType}-overdue-${id}`,
        type: 'action_overdue',
        priority: 'Alta',
        title: `Actividad vencida: ${code}`,
        message: `"${title}" venció el ${dueDate} con ${progress}% de avance. ${context}. Responsable: ${responsible}.`,
        targetId: id,
        targetType,
        date: dueDate,
        read: false,
      };
    }

    const daysUntilDue = this.daysBetween(today, dueDate);
    if (dueDate <= soon15Days) {
      return {
        id: `alert-${targetType}-due-soon-${id}`,
        type: 'action_due_soon',
        priority: daysUntilDue <= 5 ? 'Alta' : 'Media',
        title: `Actividad próxima a vencer: ${code}`,
        message: `"${title}" vence el ${dueDate} (${daysUntilDue} días). Avance: ${progress}%. ${context}. Responsable: ${responsible}.`,
        targetId: id,
        targetType,
        date: dueDate,
        read: false,
      };
    }

    if (dueDate <= soon30Days && progress === 0) {
      return {
        id: `alert-${targetType}-stalled-${id}`,
        type: 'action_due_soon',
        priority: 'Media',
        title: `Actividad sin iniciar: ${code}`,
        message: `"${title}" sigue en 0% de avance y vence el ${dueDate}. ${context}. Responsable: ${responsible}.`,
        targetId: id,
        targetType,
        date: dueDate,
        read: false,
      };
    }

    return undefined;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private dateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private addDays(date: string, days: number): string {
    const result = new Date(`${date}T00:00:00.000Z`);
    result.setUTCDate(result.getUTCDate() + days);
    return result.toISOString().slice(0, 10);
  }

  private daysBetween(from: string, to: string): number {
    const fromMs = new Date(`${from}T00:00:00.000Z`).getTime();
    const toMs = new Date(`${to}T00:00:00.000Z`).getTime();
    return Math.ceil((toMs - fromMs) / 86_400_000);
  }
}
