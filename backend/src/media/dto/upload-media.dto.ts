import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UploadMediaDto {
  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsNumber()
  studentId?: number;
}
