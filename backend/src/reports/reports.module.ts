import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Student } from '../students/student.entity';
import { IepPlan } from '../iep/entities/iep-plan.entity';
import { IepGoal } from '../iep/entities/iep-goal.entity';
import { RtiAssessment } from '../rti/entities/rti-assessment.entity';
import { FbaRecord } from '../fba/entities/fba.entity';
import { AbcRecord } from '../abc/entities/abc-record.entity';
import { Attendance } from '../attendance/attendance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, IepPlan, IepGoal, RtiAssessment, FbaRecord, AbcRecord, Attendance])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
