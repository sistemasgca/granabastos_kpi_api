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

export class CreateKpiTaskDto {
  @IsUUID()
  kpiId!: string;

  @IsInt()
  @Min(1)
  stepNumber!: number;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  scheduledFrequency!: string;

  @IsOptional()
  @IsString()
  scheduledMonth?: string;

  @IsISO8601({ strict: true })
  dueDate!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  completedDate?: string;

  @IsString()
  responsible!: string;

  @IsOptional()
  @IsIn(taskStatuses)
  status?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
