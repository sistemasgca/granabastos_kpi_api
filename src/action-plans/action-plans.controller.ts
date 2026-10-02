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
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.js';
import { CreateActionPlanDto } from './dto/create-action-plan.dto.js';
import { UpdateActionPlanDto } from './dto/update-action-plan.dto.js';
import { ActionPlansService } from './action-plans.service.js';

@Controller('action-plans')
export class ActionPlansController {
  constructor(private readonly actionPlansService: ActionPlansService) {}

  @Get()
  findAll(@Query('kpiId') kpiId?: string) {
    return this.actionPlansService.findAll(kpiId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.actionPlansService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  create(
    @Body() dto: CreateActionPlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.actionPlansService.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActionPlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.actionPlansService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.actionPlansService.remove(id, user);
  }
}
