import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EarlyWarningController } from './early-warning.controller';
import { EarlyWarningService } from './early-warning.service';
import { EarlyWarningConfig } from './entities/early-warning-config.entity';
import { RiskEvent } from './entities/risk-event.entity';
import { Student } from '../students/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EarlyWarningConfig, RiskEvent, Student])],
  controllers: [EarlyWarningController],
  providers: [EarlyWarningService],
  exports: [EarlyWarningService],
})
export class EarlyWarningModule {}
