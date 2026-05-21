import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateIepGoalDto {
  @Type(() => Number)
  @IsNumber()
  planId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetPercentage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  currentPercentage?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  teacherNotes?: string;
}
