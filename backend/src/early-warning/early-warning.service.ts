import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EarlyWarningConfig } from './entities/early-warning-config.entity';
import { RiskEvent } from './entities/risk-event.entity';
import { CreateRiskEventDto } from './dto/create-risk-event.dto';
import { UpdateEarlyWarningConfigDto } from './dto/update-early-warning-config.dto';
import { Student } from '../students/student.entity';

@Injectable()
export class EarlyWarningService {
  constructor(
    @InjectRepository(EarlyWarningConfig)
    private readonly configRepository: Repository<EarlyWarningConfig>,
    @InjectRepository(RiskEvent)
    private readonly riskEventRepository: Repository<RiskEvent>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async getConfigs() {
    return this.configRepository.find({ where: { active: true } });
  }

  async updateConfig(id: number, dto: UpdateEarlyWarningConfigDto) {
    await this.configRepository.update(id, dto);
    return this.configRepository.findOneBy({ id });
  }

  async resetConfigs(defaults: EarlyWarningConfig[]) {
    await this.configRepository.clear();
    return this.configRepository.save(defaults);
  }

  async recordEvent(dto: CreateRiskEventDto) {
    const configs = await this.configRepository.find({ where: { indicator: dto.indicator, active: true } });
    const config = configs[0];
    const weightedScore = config ? dto.value * config.weight : dto.value;
    const flagged = config ? weightedScore >= config.threshold : false;

    const event = this.riskEventRepository.create({ ...dto, weightedScore, flagged });
    const saved = await this.riskEventRepository.save(event);

    if (flagged) {
      await this.recalculateRiskScore(dto.studentId);
    }

    return saved;
  }

  async getEvents(studentId: number) {
    return this.riskEventRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  async getFlaggedStudents() {
    const flagged = await this.riskEventRepository.find({
      where: { flagged: true },
      order: { createdAt: 'DESC' },
    });
    const studentIds = [...new Set(flagged.map((e) => e.studentId))];
    return this.studentRepository.findBy({ id: In(studentIds) });
  }

  private async recalculateRiskScore(studentId: number) {
    const events = await this.riskEventRepository.find({ where: { studentId } });
    const total = events.reduce((sum, e) => sum + (e.weightedScore || 0), 0);
    await this.studentRepository.update(studentId, {
      riskScore: Math.round(total),
      riskScoreUpdatedAt: new Date(),
    });
  }
}
