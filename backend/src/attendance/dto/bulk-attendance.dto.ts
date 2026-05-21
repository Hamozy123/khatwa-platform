import { Type } from 'class-transformer';
import { IsArray, IsDateString, ValidateNested } from 'class-validator';
import { CreateAttendanceDto } from './create-attendance.dto';

export class BulkAttendanceDto {
  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttendanceDto)
  records: CreateAttendanceDto[];
}
