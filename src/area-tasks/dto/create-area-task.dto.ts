import {
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

const quarters = ['T1', 'T2', 'T3', 'T4'];

export class CreateAreaTaskDto {
  @IsString()
  code!: string;

  @IsString()
  area!: string;

  @IsString()
  processName!: string;

  @IsString()
  activity!: string;

  @IsString()
  responsible!: string;

  @IsEmail()
  responsibleEmail!: string;

  @IsIn(quarters)
  quarter!: 'T1' | 'T2' | 'T3' | 'T4';

  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @IsISO8601({ strict: true })
  startDate!: string;

  @IsISO8601({ strict: true })
  dueDate!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  progress!: number;

  @IsString()
  deliverables!: string;

  @IsOptional()
  @IsUUID()
  linkedKpiId?: string | null;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  evidenceUrl?: string;
}
