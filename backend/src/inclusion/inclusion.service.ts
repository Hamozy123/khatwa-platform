import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Repository } from 'typeorm';
import { Accommodation } from './accommodation.entity';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';

@Injectable()
export class InclusionService {
  constructor(
    @InjectRepository(Accommodation)
    private readonly accommodationRepository: Repository<Accommodation>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async create(dto: CreateAccommodationDto, createdBy: number) {
    const accommodation = this.accommodationRepository.create({ ...dto, createdBy });
    const saved = await this.accommodationRepository.save(accommodation);
    this.logger.info('accommodation created', { id: saved.id, studentId: dto.studentId, type: dto.accommodationType });
    return saved;
  }

  async findByStudent(studentId: number) {
    return this.accommodationRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, dto: Partial<CreateAccommodationDto>) {
    const existing = await this.accommodationRepository.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('التكييف غير موجود');
    Object.assign(existing, dto);
    return this.accommodationRepository.save(existing);
  }

  async remove(id: number): Promise<void> {
    const res = await this.accommodationRepository.delete(id);
    if (!res.affected) throw new NotFoundException('التكييف غير موجود');
    this.logger.info('accommodation deleted', { id });
  }
}
