import { Module } from '@nestjs/common';
import { AreaTasksController } from './area-tasks.controller.js';
import { AreaTasksService } from './area-tasks.service.js';

@Module({
  controllers: [AreaTasksController],
  providers: [AreaTasksService]
})
export class AreaTasksModule {}
