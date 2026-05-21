import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEarlyWarningConfigDto {
  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  threshold?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
