import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FbaRecord } from './entities/fba.entity';
import { CreateFbaDto } from './dto/create-fba.dto';

@Injectable()
export class FbaService {
  constructor(
    @InjectRepository(FbaRecord)
    private readonly fbaRepository: Repository<FbaRecord>,
  ) {}

  async create(dto: CreateFbaDto, createdBy: number) {
    const record = this.fbaRepository.create({ ...dto, createdBy });
    return this.fbaRepository.save(record);
  }

  async findByStudent(studentId: number) {
    return this.fbaRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const record = await this.fbaRepository.findOneBy({ id });
    if (!record) throw new NotFoundException('FBA record not found');
    return record;
  }

  async update(id: number, dto: Partial<CreateFbaDto>) {
    await this.fbaRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const res = await this.fbaRepository.delete(id);
    if (!res.affected) throw new NotFoundException('FBA record not found');
  }
}
