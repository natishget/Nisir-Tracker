import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ReportPeriod } from '@prisma/client';

export class CreateReportDto {
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  completedTasks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  inProgressTasks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  blockedTasks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  overdueTasks?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  challenges?: string;

  @IsOptional()
  @IsString()
  nextPeriodPlan?: string;
}
