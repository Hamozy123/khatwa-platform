import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDailyPlanDto {
  @IsNotEmpty()
  studentId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  @IsIn(['pending', 'in_progress', 'done', 'cancelled'])
  status?: string;

  @IsString()
  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: string;

  @IsString()
  @IsOptional()
  @IsIn(['assessment', 'therapy', 'academic', 'social', 'other'])
  type?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}