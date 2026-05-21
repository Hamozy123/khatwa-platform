import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IepController } from './iep.controller';
import { IepService } from './iep.service';
import { IepPlan } from './entities/iep-plan.entity';
import { IepGoal } from './entities/iep-goal.entity';
import { IepPlanVersion } from './entities/iep-plan-version.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IepPlan, IepGoal, IepPlanVersion])],
  controllers: [IepController],
  providers: [IepService],
  exports: [IepService],
})
export class IepModule {}
