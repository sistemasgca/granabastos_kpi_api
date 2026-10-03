import {
  IsEmail,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpdateActionPlanDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsUUID()
  kpiId?: string;

  @IsOptional()
  @IsString()
  name?: string;

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
  observations?: string | null;

  @IsOptional()
  @IsString()
  evidenceUrl?: string | null;

  @IsOptional()
  @IsString()
  evidenceNotes?: string | null;
}
