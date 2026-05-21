import { IsString, IsNotEmpty, IsOptional, MinLength, IsIn, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])/, { message: 'كلمة المرور يجب أن تحتوي على حرف كبير، حرف صغير، رقم، وحرف خاص' })
  password?: string;

  @IsString()
  @IsOptional()
  @IsIn(['admin', 'admin_manager', 'deputy_directorate', 'school_principal', 'teacher_m', 'teacher_f'])
  role?: string;

  @IsString()
  @IsOptional()
  governorate?: string;

  @IsString()
  @IsOptional()
  directorate?: string;

  @IsString()
  @IsOptional()
  administration?: string;

  @IsString()
  @IsOptional()
  schoolName?: string;
}
