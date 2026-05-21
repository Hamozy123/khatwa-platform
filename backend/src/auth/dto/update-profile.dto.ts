import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsIn(['admin', 'admin_manager', 'deputy_directorate', 'school_principal', 'teacher_m', 'teacher_f'])
  role?: string;

  @IsOptional()
  @IsString()
  governorate?: string;

  @IsOptional()
  @IsString()
  directorate?: string;

  @IsOptional()
  @IsString()
  administration?: string;

  @IsOptional()
  @IsString()
  schoolName?: string;
}
