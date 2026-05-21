import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateBehaviorAssessmentDto {
  @IsNumber()
  studentId: number;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsObject()
  indicators: Record<string, number>;

  @IsOptional()
  @IsString()
  notes?: string;
}
