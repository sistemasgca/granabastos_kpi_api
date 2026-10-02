import { Module } from '@nestjs/common';
import { KpisController } from './kpis.controller.js';
import { KpisService } from './kpis.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [KpisController],
  providers: [KpisService],
})
export class KpisModule {}
