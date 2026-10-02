import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

const taskStatuses = ['Pendiente', 'En curso', 'Completada', 'Retrasada'];

export class UpdateKpiTaskDto {
  @IsOptional()
  @IsUUID()
  kpiId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  stepNumber?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  scheduledFrequency?: string;

  @IsOptional()
  @IsString()
  scheduledMonth?: string | null;

  @IsOptional()
  @IsISO8601({ strict: true })
  dueDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  completedDate?: string | null;

  @IsOptional()
  @IsString()
  responsible?: string;

  @IsOptional()
  @IsIn(taskStatuses)
  status?: string;

  @IsOptional()
  @IsString()
  observations?: string | null;
}
