import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
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

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'granabastos-kpi-api',
    }),
    PrismaModule,
    KpisModule,
    MeasurementsModule,
    KpiTasksModule,
    ActionPlansModule,
    AreaTasksModule,
    AlertsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
