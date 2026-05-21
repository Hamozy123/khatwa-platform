import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAccommodationDto {
  @IsNumber()
  studentId: number;

  @IsString()
  @IsNotEmpty()
  accommodationType: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
