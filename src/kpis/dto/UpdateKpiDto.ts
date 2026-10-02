import { PartialType } from '@nestjs/swagger';
import { CreateKpiDto } from './CreateKpiDto.js';

export class UpdateKpiDto extends PartialType(CreateKpiDto) {}
