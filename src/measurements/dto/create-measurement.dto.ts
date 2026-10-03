import { Quarter } from '@prisma/client';
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateMeasurementDto {
  @IsUUID()
  kpiId!: string;

  @IsEnum(Quarter)
  quarter!: Quarter;

  @IsInt()
  @Min(2024)
  @Max(2028)
  year!: number;

  @IsISO8601({ strict: true })
  date!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  inputA?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  inputB?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
