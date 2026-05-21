import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Repository } from 'typeorm';
import { BehaviorAssessment } from './behavior-assessment.entity';
import { CreateBehaviorAssessmentDto } from './dto/create-behavior-assessment.dto';

@Injectable()
export class BehaviorService {
  constructor(
    @InjectRepository(BehaviorAssessment)
    private readonly assessmentRepository: Repository<BehaviorAssessment>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async create(dto: CreateBehaviorAssessmentDto, createdBy: number) {
    const assessment = this.assessmentRepository.create({ ...dto, createdBy });
    const saved = await this.assessmentRepository.save(assessment);
    this.logger.info('behavior assessment created', { assessmentId: saved.id, studentId: dto.studentId });
    return saved;
  }

  async findByStudent(studentId: number) {
    return this.assessmentRepository.find({
      where: { studentId },
      order: { date: 'DESC' },
    });
  }

  async getTrend(studentId: number, indicator: string) {
    const all = await this.assessmentRepository.find({
      where: { studentId },
      order: { date: 'ASC' },
    });
    return all
      .filter((a) => a.indicators[indicator] !== undefined)
      .map((a) => ({ date: a.date, value: a.indicators[indicator] }));
  }

  async remove(id: number): Promise<void> {
    await this.assessmentRepository.delete(id);
    this.logger.info('behavior assessment deleted', { assessmentId: id });
  }
}
