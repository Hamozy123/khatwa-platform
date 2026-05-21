import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Student } from '../students/student.entity';
import { Attendance } from '../attendance/attendance.entity';
import { IepPlan } from '../iep/entities/iep-plan.entity';
import { IepGoal } from '../iep/entities/iep-goal.entity';
import { RiskEvent } from '../early-warning/entities/risk-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Attendance, IepPlan, IepGoal, RiskEvent])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
