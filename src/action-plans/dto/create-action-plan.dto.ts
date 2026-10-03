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

export class CreateActionPlanDto {
  @IsString()
  code!: string;

  @IsUUID()
  kpiId!: string;

  @IsString()
  name!: string;

  @IsString()
  activity!: string;

  @IsString()
  responsible!: string;

  @IsEmail()
  responsibleEmail!: string;

  @IsISO8601({ strict: true })
  startDate!: string;

  @IsISO8601({ strict: true })
  dueDate!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  progress!: number;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  evidenceUrl?: string;

  @IsOptional()
  @IsString()
  evidenceNotes?: string;
}
