import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyPlan } from './entities/daily-plan.entity';
import { CreateDailyPlanDto } from './dto/create-daily-plan.dto';
import { UpdateDailyPlanDto } from './dto/update-daily-plan.dto';

@Injectable()
export class DailyPlanService {
  constructor(
    @InjectRepository(DailyPlan)
    private readonly planRepository: Repository<DailyPlan>,
  ) {}

  async findAll(date?: string, studentId?: number) {
    const where: any = {};
    if (date) where.date = date;
    if (studentId) where.studentId = studentId;
    return this.planRepository.find({ where, order: { startTime: 'ASC' } });
  }

  async findOne(id: number) {
    const plan = await this.planRepository.findOneBy({ id });
    if (!plan) throw new NotFoundException('النشاط غير موجود');
    return plan;
  }

  async create(dto: CreateDailyPlanDto) {
    const plan = this.planRepository.create(dto);
    return this.planRepository.save(plan);
  }

  async update(id: number, dto: UpdateDailyPlanDto) {
    await this.findOne(id);
    await this.planRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const plan = await this.findOne(id);
    await this.planRepository.delete(id);
    return plan;
  }
}