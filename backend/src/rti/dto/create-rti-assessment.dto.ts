import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateRtiAssessmentDto {
  @IsInt()
  studentId: number;

  @IsInt()
  @Min(1)
  @Max(3)
  previousTier: number;

  @IsInt()
  @Min(1)
  @Max(3)
  newTier: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsInt()
  assessedBy?: number;
}
