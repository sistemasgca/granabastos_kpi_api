import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.js';
import { CreateMeasurementDto } from './dto/create-measurement.dto.js';
import { MeasurementsService } from './measurements.service.js';

@Controller('measurements')
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  @Get()
  findAll(@Query('kpiId') kpiId?: string) {
    return this.measurementsService.findAll(kpiId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.measurementsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  create(
    @Body() dto: CreateMeasurementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.measurementsService.create(dto, user);
  }
}
