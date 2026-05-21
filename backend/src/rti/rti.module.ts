import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RtiController } from './rti.controller';
import { RtiService } from './rti.service';
import { RtiAssessment } from './entities/rti-assessment.entity';
import { Student } from '../students/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RtiAssessment, Student])],
  controllers: [RtiController],
  providers: [RtiService],
  exports: [RtiService],
})
export class RtiModule {}
