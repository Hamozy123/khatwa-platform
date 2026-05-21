import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAttendanceDto {
  @IsNumber()
  studentId: number;

  @IsDateString()
  date: string;

  @IsIn(['present', 'absent', 'late', 'excused'])
  status: string;

  @IsOptional()
  @IsString()
  checkIn?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
