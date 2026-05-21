import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PiiAccessLog } from './pii-access-log.entity';

@Injectable()
export class PrivacyService {
  constructor(
    @InjectRepository(PiiAccessLog)
    private readonly logRepository: Repository<PiiAccessLog>,
  ) {}

  async logAccess(entry: Partial<PiiAccessLog>) {
    return this.logRepository.save(this.logRepository.create(entry));
  }

  async findByStudent(studentId: number) {
    return this.logRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number) {
    return this.logRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(skip = 0, take = 100) {
    return this.logRepository.find({
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }
}
