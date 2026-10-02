import { Module } from '@nestjs/common';
import { KpiTasksController } from './kpi-tasks.controller.js';
import { KpiTasksService } from './kpi-tasks.service.js';

@Module({
  controllers: [KpiTasksController],
  providers: [KpiTasksService]
})
export class KpiTasksModule {}
