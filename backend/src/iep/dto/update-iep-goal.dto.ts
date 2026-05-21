import { PartialType } from '@nestjs/mapped-types';
import { CreateIepGoalDto } from './create-iep-goal.dto';

export class UpdateIepGoalDto extends PartialType(CreateIepGoalDto) {}
