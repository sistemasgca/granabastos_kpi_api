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

export class UpdateAreaTaskDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  processName?: string;

  @IsOptional()
  @IsString()
  activity?: string;

  @IsOptional()
  @IsString()
  responsible?: string;

  @IsOptional()
  @IsEmail()
  responsibleEmail?: string;

  @IsOptional()
  @IsIn(quarters)
  quarter?: 'T1' | 'T2' | 'T3' | 'T4';

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsISO8601({ strict: true })
  startDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsString()
  deliverables?: string;

  @IsOptional()
  @IsUUID()
  linkedKpiId?: string | null;

  @IsOptional()
  @IsString()
  observations?: string | null;

  @IsOptional()
  @IsString()
  evidenceUrl?: string | null;
}
