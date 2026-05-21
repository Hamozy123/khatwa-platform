import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, ILike } from 'typeorm';
import { Student } from './student.entity';

describe('StudentsService', () => {
  let service: StudentsService;
  let repo: Repository<Student>;
  let dataSource: DataSource;

  const mockStudent = {
    id: 1,
    fullName: 'طالب تجربة',
    gender: 'ذكر',
    disabilityType: 'صعوبات تعلم',
    diagnosis: 'عسر القراءة',
    status: 'active',
  };

  const mockRepo = {
    findAndCount: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: getRepositoryToken(Student), useValue: mockRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    repo = module.get<Repository<Student>>(getRepositoryToken(Student));
    dataSource = module.get<DataSource>(DataSource);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated students', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockStudent], 1]);

      const result = await service.findAll({ skip: 0, take: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.skip).toBe(0);
      expect(result.take).toBe(20);
    });

    it('should search by fullName', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockStudent], 1]);

      await service.findAll({ search: 'طالب' });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { fullName: ILike('%طالب%') },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a student by id', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockStudent);
      const result = await service.findOne(1);
      expect(result).toEqual(mockStudent);
    });

    it('should return null when not found', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a student', async () => {
      mockRepo.create.mockReturnValue(mockStudent);
      mockRepo.save.mockResolvedValue(mockStudent);

      const result = await service.create(mockStudent as any);
      expect(result.fullName).toBe('طالب تجربة');
    });
  });

  describe('update', () => {
    it('should update a student', async () => {
      mockRepo.update.mockResolvedValue({ affected: 1 });
      mockRepo.findOneBy.mockResolvedValue({ ...mockStudent, fullName: 'اسم محدث' });

      const result = await service.update(1, { fullName: 'اسم محدث' } as any);
      expect(result).not.toBeNull();
      expect(result!.fullName).toBe('اسم محدث');
    });
  });

  describe('remove', () => {
    it('should delete student with cascade', async () => {
      const mockPlanRepo = { find: jest.fn().mockResolvedValue([{ id: 1 }]), delete: jest.fn() };
      const mockGoalRepo = { delete: jest.fn() };
      const mockStudentRepo = { delete: jest.fn() };

      mockDataSource.transaction.mockImplementation(async (cb: any) => {
        const em = {
          getRepository: jest.fn((entity: any) => {
            if (entity.name === 'IepPlan') return mockPlanRepo;
            if (entity.name === 'IepGoal') return mockGoalRepo;
            return mockStudentRepo;
          }),
        };
        await cb(em);
      });

      await service.remove(1);
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });
  });
});
