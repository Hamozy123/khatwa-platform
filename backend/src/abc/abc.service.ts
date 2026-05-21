import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbcRecord } from './entities/abc-record.entity';
import { CreateAbcRecordDto } from './dto/create-abc-record.dto';

@Injectable()
export class AbcService {
  constructor(
    @InjectRepository(AbcRecord)
    private readonly abcRepository: Repository<AbcRecord>,
  ) {}

  async create(dto: CreateAbcRecordDto, recordedBy: number) {
    const record = this.abcRepository.create({ ...dto, recordedBy });
    return this.abcRepository.save(record);
  }

  async findByStudent(studentId: number) {
    return this.abcRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTrend(studentId: number) {
    const records = await this.abcRepository.find({
      where: { studentId },
      order: { date: 'ASC', time: 'ASC' },
    });

    const behaviorFreq: Record<string, number> = {};
    const locationFreq: Record<string, number> = {};
    const antecedentFreq: Record<string, number> = {};

    for (const r of records) {
      behaviorFreq[r.behavior] = (behaviorFreq[r.behavior] || 0) + 1;
      if (r.location) locationFreq[r.location] = (locationFreq[r.location] || 0) + 1;
      antecedentFreq[r.antecedent] = (antecedentFreq[r.antecedent] || 0) + 1;
    }

    return {
      totalRecords: records.length,
      behaviorFrequency: behaviorFreq,
      locationFrequency: locationFreq,
      antecedentFrequency: antecedentFreq,
      records,
    };
  }

  async remove(id: number) {
    await this.abcRepository.delete(id);
  }
}
