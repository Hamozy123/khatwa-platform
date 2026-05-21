import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, ILike } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { IepPlan } from '../iep/entities/iep-plan.entity';
import { IepGoal } from '../iep/entities/iep-goal.entity';
import { Attendance } from '../attendance/attendance.entity';
import { AbcRecord } from '../abc/entities/abc-record.entity';
import { FbaRecord } from '../fba/entities/fba.entity';
import { RtiAssessment } from '../rti/entities/rti-assessment.entity';
import { RiskEvent } from '../early-warning/entities/risk-event.entity';
import { BehaviorAssessment } from '../behavior/behavior-assessment.entity';
import { DailyPlan } from '../daily-plan/entities/daily-plan.entity';
import { buildScopeFilter } from '../core/scope.utils';
import { encrypt, decrypt } from '../core/encryption.utils';

const PII_FIELDS = ['fullName', 'diagnosis', 'birthDate'] as const;

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly dataSource: DataSource,
  ) {}

  private encryptPii(dto: Partial<CreateStudentDto>): string | undefined {
    const pii: Record<string, string> = {};
    for (const field of PII_FIELDS) {
      if ((dto as any)[field]) pii[field] = (dto as any)[field];
    }
    if (Object.keys(pii).length === 0) return undefined;
    return encrypt(JSON.stringify(pii));
  }

  private stripPii(student: Student): Student {
    for (const field of PII_FIELDS) {
      (student as any)[field] = undefined;
    }
    return student;
  }

  async findAll(opts: { search?: string; skip?: number; take?: number; user?: any } = {}) {
    const { search, skip, take, user } = opts;
    const where: any = { ...buildScopeFilter(user) };
    if (search) {
      where.fullName = ILike(`%${search}%`);
    }
    const [data, total] = await this.studentRepository.findAndCount({
      where,
      order: { id: 'ASC' },
      skip: skip || 0,
      take: take || 100,
    });
    return { data, total, skip: skip || 0, take: take || 100 };
  }

  async findOne(id: number, user?: any) {
    const student = await this.studentRepository.findOneBy({ id });
    if (!student) return null;
    const filter = buildScopeFilter(user);
    if (filter.directorate && student.directorate !== filter.directorate) return null;
    if (filter.schoolName && student.schoolName !== filter.schoolName) return null;
    return student;
  }

  async create(createStudentDto: CreateStudentDto) {
    const piiEncrypted = this.encryptPii(createStudentDto);
    const student = this.studentRepository.create({ ...createStudentDto, piiEncrypted });
    return this.studentRepository.save(student);
  }

  async update(id: number, updateStudentDto: CreateStudentDto) {
    const piiEncrypted = this.encryptPii(updateStudentDto);
    await this.studentRepository.update(id, { ...updateStudentDto, ...(piiEncrypted ? { piiEncrypted } : {}) });
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.dataSource.transaction(async (em) => {
      const planRepo = em.getRepository(IepPlan);
      const goalRepo = em.getRepository(IepGoal);
      const plans = await planRepo.find({ where: { studentId: id } });
      for (const p of plans) {
        await goalRepo.delete({ planId: p.id });
      }
      await planRepo.delete({ studentId: id });
      await em.getRepository(Attendance).delete({ studentId: id });
      await em.getRepository(AbcRecord).delete({ studentId: id });
      await em.getRepository(FbaRecord).delete({ studentId: id });
      await em.getRepository(RtiAssessment).delete({ studentId: id });
      await em.getRepository(RiskEvent).delete({ studentId: id });
      await em.getRepository(BehaviorAssessment).delete({ studentId: id });
      await em.getRepository(DailyPlan).delete({ studentId: id });
      await em.getRepository(Student).delete(id);
    });
  }

  async getDecryptedPii(studentId: number, user?: any): Promise<Record<string, string> | null> {
    const student = await this.findOne(studentId, user);
    if (!student || !student.piiEncrypted) return null;
    try {
      return JSON.parse(decrypt(student.piiEncrypted));
    } catch {
      return null;
    }
  }
}
