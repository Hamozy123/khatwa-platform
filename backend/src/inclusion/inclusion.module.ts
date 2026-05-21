import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InclusionController } from './inclusion.controller';
import { InclusionService } from './inclusion.service';
import { Accommodation } from './accommodation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Accommodation])],
  controllers: [InclusionController],
  providers: [InclusionService],
  exports: [InclusionService],
})
export class InclusionModule {}
