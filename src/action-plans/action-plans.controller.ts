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
  create(@Body() dto: CreateActionPlanDto) {
    return this.actionPlansService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActionPlanDto,
  ) {
    return this.actionPlansService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.actionPlansService.remove(id);
  }
}
