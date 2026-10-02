import { Module } from '@nestjs/common';
import { KpiTasksController } from './kpi-tasks.controller.js';
import { KpiTasksService } from './kpi-tasks.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [KpiTasksController],
  providers: [KpiTasksService],
})
export class KpiTasksModule {}
