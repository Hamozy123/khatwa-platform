import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Parent } from './entities/parent.entity';
import { CreateParentDto } from './dto/create-parent.dto';
import { ParentLoginDto } from './dto/parent-login.dto';

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
  ) {}

  private hashPin(pin: string, salt?: string): { hash: string; salt: string } {
    const s = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(pin, s, 1000, 64, 'sha512').toString('hex');
    return { hash, salt: s };
  }

  async create(dto: CreateParentDto) {
    const existing = await this.parentRepository.findOne({ where: [
      { phone: dto.phone },
      ...(dto.email ? [{ email: dto.email }] : []),
    ]});
    if (existing) throw new ConflictException('Parent with this phone or email already exists');

    const { hash, salt } = this.hashPin(dto.pin);
    const parent = this.parentRepository.create({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      pinHash: `${salt}:${hash}`,
      active: dto.active ?? true,
    });
    return this.parentRepository.save(parent);
  }

  async login(dto: ParentLoginDto) {
    const parent = await this.parentRepository.findOne({ where: { phone: dto.phone } });
    if (!parent || !parent.active) throw new UnauthorizedException('Invalid credentials');

    const [salt, storedHash] = parent.pinHash.split(':');
    const { hash } = this.hashPin(dto.pin, salt);
    if (hash !== storedHash) throw new UnauthorizedException('Invalid credentials');

    await this.parentRepository.update(parent.id, { lastLoginAt: new Date() });

    const token = crypto.randomBytes(32).toString('hex');
    return { token, parentId: parent.id, fullName: parent.fullName };
  }

  async findChildren(parentId: number) {
    const { Student } = await import('../students/student.entity');
    const students = await this.parentRepository.manager.find(Student, {
      where: { parentId },
    });
    return students;
  }

  async findOne(id: number) {
    return this.parentRepository.findOneBy({ id });
  }

  async findAll() {
    return this.parentRepository.find({ order: { fullName: 'ASC' } });
  }
}
