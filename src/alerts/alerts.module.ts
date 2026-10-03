import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller.js';
import { AlertsService } from './alerts.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AlertsController],
  providers: [AlertsService],
})
export class AlertsModule {}
