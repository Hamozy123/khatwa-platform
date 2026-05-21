import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RtiAssessment } from './entities/rti-assessment.entity';
import { CreateRtiAssessmentDto } from './dto/create-rti-assessment.dto';
import { Student } from '../students/student.entity';

@Injectable()
export class RtiService {
  constructor(
    @InjectRepository(RtiAssessment)
    private readonly rtiRepository: Repository<RtiAssessment>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async create(dto: CreateRtiAssessmentDto) {
    const assessment = this.rtiRepository.create(dto);
    const saved = await this.rtiRepository.save(assessment);

    await this.studentRepository.update(dto.studentId, {
      rtiTier: dto.newTier,
      rtiTierAssessedAt: new Date(),
    });

    return saved;
  }

  async findByStudent(studentId: number) {
    return this.rtiRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  async suggestTier(student: Student): Promise<number> {
    const disability = (student.disabilityType || '').toLowerCase();
    const diagnosis = (student.diagnosis || '').toLowerCase();

    const highIntensity = [
      'autism', 'autizm', 'توحد', 'ذاتوي',
      'severe', 'شديد', 'عميق',
      'multiple', 'متعدد',
      'intellectual disability', 'اعاقة ذهنية',
    ];
    const moderateIntensity = [
      'ld', 'learning disability', 'صعوبات تعلم',
      'adhd', 'فرط حركة',
      'speech', 'نطق',
      'dyslexia', 'عسر قراءة',
    ];

    if (highIntensity.some((k) => disability.includes(k) || diagnosis.includes(k))) return 3;
    if (moderateIntensity.some((k) => disability.includes(k) || diagnosis.includes(k))) return 2;
    return 1;
  }

  async findAll() {
    return this.rtiRepository.find({ order: { createdAt: 'DESC' } });
  }

  async suggestForStudent(studentId: number): Promise<{ tier: number | null }> {
    const student = await this.studentRepository.findOneBy({ id: studentId });
    if (!student) return { tier: null };
    const tier = await this.suggestTier(student);
    return { tier };
  }
}
