import { Module } from '@nestjs/common';
import { ActionPlansController } from './action-plans.controller.js';
import { ActionPlansService } from './action-plans.service.js';

@Module({
  controllers: [ActionPlansController],
  providers: [ActionPlansService]
})
export class ActionPlansModule {}
