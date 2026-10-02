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
import { CreateAreaTaskDto } from './dto/create-area-task.dto.js';
import { UpdateAreaTaskDto } from './dto/update-area-task.dto.js';
import { AreaTasksService } from './area-tasks.service.js';

@Controller('area-tasks')
export class AreaTasksController {
  constructor(private readonly areaTasksService: AreaTasksService) {}

  @Get()
  findAll(
    @Query('area') area?: string,
    @Query('year') year?: string,
    @Query('quarter') quarter?: string,
  ) {
    return this.areaTasksService.findAll({ area, year, quarter });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.areaTasksService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAreaTaskDto) {
    return this.areaTasksService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAreaTaskDto,
  ) {
    return this.areaTasksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.areaTasksService.remove(id);
  }
}
