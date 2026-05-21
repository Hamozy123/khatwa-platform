import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FbaController } from './fba.controller';
import { FbaService } from './fba.service';
import { FbaRecord } from './entities/fba.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FbaRecord])],
  controllers: [FbaController],
  providers: [FbaService],
  exports: [FbaService],
})
export class FbaModule {}
