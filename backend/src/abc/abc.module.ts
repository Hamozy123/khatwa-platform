import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbcController } from './abc.controller';
import { AbcService } from './abc.service';
import { AbcRecord } from './entities/abc-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AbcRecord])],
  controllers: [AbcController],
  providers: [AbcService],
  exports: [AbcService],
})
export class AbcModule {}
