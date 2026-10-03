import { KpiDirection, Periodicity } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateKpiDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  objective!: string;

  @IsString()
  area!: string;

  @IsNumber()
  @Min(0)
  targetValue!: number;

  @IsNumber()
  @Min(0)
  currentValue!: number;

  @IsString()
  unit!: string;

  @IsEnum(KpiDirection)
  direction!: KpiDirection;

  @IsString()
  responsible!: string;

  @IsEmail()
  responsibleEmail!: string;

  @IsEnum(Periodicity)
  periodicity!: Periodicity;

  @IsOptional()
  @IsISO8601({ strict: true })
  lastUpdated?: string;
}
