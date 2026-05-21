import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])/, { message: 'كلمة المرور الجديدة يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، وحرف خاص' })
  newPassword: string;
}
