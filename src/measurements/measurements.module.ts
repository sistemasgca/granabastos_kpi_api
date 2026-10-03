import { Module } from '@nestjs/common';
import { MeasurementsController } from './measurements.controller.js';
import { MeasurementsService } from './measurements.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [MeasurementsController],
  providers: [MeasurementsService],
})
export class MeasurementsModule {}
