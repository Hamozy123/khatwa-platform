import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateIepPlanDto {
  @Type(() => Number)
  @IsNumber()
  studentId: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  createdBy?: number;

  @IsOptional()
  @IsString()
  plop?: string;

  @IsOptional()
  @IsObject()
  plopData?: {
    strengths: string[];
    needs: string[];
    preferences: string[];
    baselineData?: Record<string, any>;
  };

  @IsOptional()
  @IsNumber()
  version?: number;
}
