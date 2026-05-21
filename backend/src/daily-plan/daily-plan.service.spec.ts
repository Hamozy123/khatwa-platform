import { Test, TestingModule } from '@nestjs/testing';
import { DailyPlanService } from './daily-plan.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyPlan } from './entities/daily-plan.entity';
import { NotFoundException } from '@nestjs/common';

describe('DailyPlanService', () => {
  let service: DailyPlanService;

  const mockPlan = {
    id: 1,
    studentId: 1,
    title: 'نشاط 1',
    date: '2026-05-13',
    description: 'وصف',
    startTime: '09:00',
    endTime: '10:00',
    status: 'pending',
    priority: 'high',
    type: 'academic',
  };

  const mockRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyPlanService,
        { provide: getRepositoryToken(DailyPlan), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<DailyPlanService>(DailyPlanService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return plans filtered by date', async () => {
      mockRepo.find.mockResolvedValue([mockPlan]);
      const result = await service.findAll('2026-05-13');
      expect(result).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { date: '2026-05-13' },
        order: { startTime: 'ASC' },
      });
    });

    it('should return plans filtered by studentId', async () => {
      mockRepo.find.mockResolvedValue([mockPlan]);
      const result = await service.findAll(undefined, 1);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a plan', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockPlan);
      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    });

    it('should throw when not found', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a plan', async () => {
      const dto = { studentId: 1, title: 'نشاط', date: '2026-05-13' };
      mockRepo.create.mockReturnValue(dto);
      mockRepo.save.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto as any);
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('should update a plan', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockPlan);
      mockRepo.update.mockResolvedValue({ affected: 1 });
      mockRepo.findOneBy.mockResolvedValue({ ...mockPlan, title: 'محدث' });

      const result = await service.update(1, { title: 'محدث' } as any);
      expect(result.title).toBe('محدث');
    });
  });

  describe('remove', () => {
    it('should delete and return the plan', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockPlan);
      mockRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(1);
      expect(result.id).toBe(1);
      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});
