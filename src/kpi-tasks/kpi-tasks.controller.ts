import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateKpiTaskDto } from './dto/create-kpi-task.dto.js';
import { UpdateKpiTaskDto } from './dto/update-kpi-task.dto.js';
import { KpiTasksService } from './kpi-tasks.service.js';

@Controller('kpi-tasks')
export class KpiTasksController {
  constructor(private readonly kpiTasksService: KpiTasksService) {}

  @Get()
  findAll(@Query('kpiId') kpiId?: string) {
    return this.kpiTasksService.findAll(kpiId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.kpiTasksService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  create(@Body() dto: CreateKpiTaskDto) {
    return this.kpiTasksService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKpiTaskDto,
  ) {
    return this.kpiTasksService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.kpiTasksService.remove(id);
  }
}
