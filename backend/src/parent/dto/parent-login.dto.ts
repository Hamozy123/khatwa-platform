import { IsString } from 'class-validator';

export class ParentLoginDto {
  @IsString()
  phone: string;

  @IsString()
  pin: string;
}
