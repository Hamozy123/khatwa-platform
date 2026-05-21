import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAbcRecordDto {
  @IsInt()
  studentId: number;

  @IsString()
  antecedent: string;

  @IsString()
  behavior: string;

  @IsString()
  consequence: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
