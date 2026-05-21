import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Repository, Between } from 'typeorm';
import { Attendance } from './attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async create(dto: CreateAttendanceDto, userId: number): Promise<Attendance> {
    const existing = await this.attendanceRepository.findOne({
      where: { studentId: dto.studentId, date: dto.date },
    });
    if (existing) {
      existing.status = dto.status;
      existing.checkIn = dto.checkIn ?? '';
      existing.notes = dto.notes ?? '';
      existing.recordedBy = userId;
      const saved = await this.attendanceRepository.save(existing);
      this.logger.info('attendance updated', { id: saved.id, studentId: dto.studentId, date: dto.date, status: dto.status });
      return saved;
    }
    const record = this.attendanceRepository.create({
      ...dto,
      recordedBy: userId,
    });
    const saved = await this.attendanceRepository.save(record);
    this.logger.info('attendance created', { id: saved.id, studentId: dto.studentId, date: dto.date, status: dto.status });
    return saved;
  }

  async bulkCreate(dto: BulkAttendanceDto, userId: number): Promise<Attendance[]> {
    const results: Attendance[] = [];
    for (const record of dto.records) {
      const saved = await this.create({ ...record, date: dto.date }, userId);
      results.push(saved);
    }
    this.logger.info('bulk attendance saved', { date: dto.date, count: results.length });
    return results;
  }

  async findByDate(date: string): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { date },
      order: { studentId: 'ASC' },
    });
  }

  async findByStudent(studentId: number, from?: string, to?: string): Promise<Attendance[]> {
    const where: any = { studentId };
    if (from && to) {
      where.date = Between(from, to);
    }
    return this.attendanceRepository.find({
      where,
      order: { date: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Attendance> {
    const record = await this.attendanceRepository.findOne({ where: { id } });
    if (!record) throw new NotFoundException('سجل الحضور غير موجود');
    return record;
  }

  async update(id: number, dto: UpdateAttendanceDto): Promise<Attendance> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    const saved = await this.attendanceRepository.save(record);
    this.logger.info('attendance updated', { id: saved.id });
    return saved;
  }

  async remove(id: number): Promise<void> {
    const record = await this.findOne(id);
    await this.attendanceRepository.delete(id);
    this.logger.info('attendance deleted', { id });
  }

  async getSummary(date: string): Promise<{ present: number; absent: number; late: number; excused: number; total: number }> {
    const records = await this.findByDate(date);
    const summary = { present: 0, absent: 0, late: 0, excused: 0, total: records.length };
    for (const r of records) {
      if (r.status === 'present') summary.present++;
      else if (r.status === 'absent') summary.absent++;
      else if (r.status === 'late') summary.late++;
      else if (r.status === 'excused') summary.excused++;
    }
    return summary;
  }
}
