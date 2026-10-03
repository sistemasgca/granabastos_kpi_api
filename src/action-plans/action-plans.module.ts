import { Module } from '@nestjs/common';
import { ActionPlansController } from './action-plans.controller.js';
import { ActionPlansService } from './action-plans.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ActionPlansController],
  providers: [ActionPlansService],
})
export class ActionPlansModule {}
