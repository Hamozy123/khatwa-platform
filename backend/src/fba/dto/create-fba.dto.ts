import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AntecedentDto {
  @IsString()
  description: string;

  @IsString()
  frequency: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class BehaviorDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  intensity?: string;
}

class ConsequenceDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  effectiveness?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class BipDto {
  @IsString()
  replacementBehavior: string;

  @IsArray()
  interventionStrategies: string[];

  @IsString()
  reinforcementPlan: string;

  @IsOptional()
  @IsString()
  crisisPlan?: string;

  @IsOptional()
  @IsString()
  reviewDate?: string;
}

export class CreateFbaDto {
  @IsInt()
  studentId: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AntecedentDto)
  antecedents?: AntecedentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BehaviorDto)
  behaviors?: BehaviorDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsequenceDto)
  consequences?: ConsequenceDto[];

  @IsOptional()
  @IsString()
  hypothesis?: string;

  @IsOptional()
  @IsString()
  targetBehavior?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BipDto)
  bip?: BipDto;

  @IsOptional()
  @IsString()
  date?: string;
}
