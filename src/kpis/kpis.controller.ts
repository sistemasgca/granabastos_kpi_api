import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateKpiDto } from './dto/CreateKpiDto.js';
import { UpdateKpiDto } from './dto/UpdateKpiDto.js';
import { KpisService } from './kpis.service.js';

@Controller('kpis')
export class KpisController {
  constructor(private readonly kpisService: KpisService) {}

  @Get()
  findAll() {
    return this.kpisService.findAll();
  }

  @Post()
  create(@Body() dto: CreateKpiDto) {
    return this.kpisService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.kpisService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKpiDto,
  ) {
    return this.kpisService.update(id, dto);
  }
}
