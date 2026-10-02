import { Module } from '@nestjs/common';
import { AreaTasksController } from './area-tasks.controller.js';
import { AreaTasksService } from './area-tasks.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AreaTasksController],
  providers: [AreaTasksService],
})
export class AreaTasksModule {}
