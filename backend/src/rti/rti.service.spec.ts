import { Test, TestingModule } from '@nestjs/testing';
import { RtiService } from './rti.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RtiAssessment } from './entities/rti-assessment.entity';
import { Student } from '../students/student.entity';

describe('RtiService', () => {
  let service: RtiService;

  const mockRtiRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockStudentRepo = {
    update: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RtiService,
        { provide: getRepositoryToken(RtiAssessment), useValue: mockRtiRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
      ],
    }).compile();

    service = module.get<RtiService>(RtiService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an assessment and update student tier', async () => {
      const dto = { studentId: 1, previousTier: 2, newTier: 3, reason: 'Escalation' };
      const saved = { id: 1, ...dto, createdAt: new Date() };
      mockRtiRepo.create.mockReturnValue(saved);
      mockRtiRepo.save.mockResolvedValue(saved);
      mockStudentRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.create(dto);

      expect(mockStudentRepo.update).toHaveBeenCalledWith(1, { rtiTier: 3, rtiTierAssessedAt: expect.any(Date) });
      expect(result.id).toBe(1);
    });
  });

  describe('findByStudent', () => {
    it('should return assessments ordered by createdAt DESC', async () => {
      const assessments = [{ id: 1, studentId: 1, previousTier: 1, newTier: 2 }];
      mockRtiRepo.find.mockResolvedValue(assessments);

      const result = await service.findByStudent(1);
      expect(result).toEqual(assessments);
      expect(mockRtiRepo.find).toHaveBeenCalledWith({ where: { studentId: 1 }, order: { createdAt: 'DESC' } });
    });
  });

  describe('suggestTier', () => {
    it('should return tier 3 for severe disabilities', async () => {
      const student = { disabilityType: 'autism', diagnosis: 'severe' } as Student;
      expect(await service.suggestTier(student)).toBe(3);
    });

    it('should return tier 2 for learning disabilities', async () => {
      const student = { disabilityType: 'ld', diagnosis: 'dyslexia' } as Student;
      expect(await service.suggestTier(student)).toBe(2);
    });

    it('should return tier 1 for mild/no diagnosis', async () => {
      const student = { disabilityType: '', diagnosis: '' } as Student;
      expect(await service.suggestTier(student)).toBe(1);
    });
  });

  describe('suggestForStudent', () => {
    it('should return tier from student lookup', async () => {
      mockStudentRepo.findOneBy.mockResolvedValue({ disabilityType: 'adhd', diagnosis: '' } as Student);
      const result = await service.suggestForStudent(1);
      expect(result.tier).toBe(2);
    });

    it('should return null when student not found', async () => {
      mockStudentRepo.findOneBy.mockResolvedValue(null);
      const result = await service.suggestForStudent(999);
      expect(result.tier).toBeNull();
    });
  });
});
