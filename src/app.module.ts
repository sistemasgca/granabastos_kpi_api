import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { KpisModule } from './kpis/kpis.module.js';
import { MeasurementsModule } from './measurements/measurements.module.js';
import { KpiTasksModule } from './kpi-tasks/kpi-tasks.module.js';
import { ActionPlansModule } from './action-plans/action-plans.module.js';
import { AreaTasksModule } from './area-tasks/area-tasks.module.js';
import { AlertsModule } from './alerts/alerts.module.js';
import { AuthModule } from './auth/auth.module.js';
import { FilesModule } from './files/files.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    KpisModule,
    MeasurementsModule,
    KpiTasksModule,
    ActionPlansModule,
    AreaTasksModule,
    AlertsModule,
    AuthModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
