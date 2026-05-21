import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRiskEventDto {
  @IsInt()
  studentId: number;

  @IsString()
  indicator: string;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  recordedBy?: number;
}
