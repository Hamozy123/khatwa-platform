import { Test, TestingModule } from '@nestjs/testing';
import { IepService } from './iep.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { IepPlan } from './entities/iep-plan.entity';
import { IepGoal } from './entities/iep-goal.entity';
import { IepPlanVersion } from './entities/iep-plan-version.entity';
import { NotFoundException } from '@nestjs/common';

describe('IepService', () => {
  let service: IepService;

  const mockPlanRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockGoalRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockVersionRepo = {
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockDataSource = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IepService,
        { provide: getRepositoryToken(IepPlan), useValue: mockPlanRepo },
        { provide: getRepositoryToken(IepGoal), useValue: mockGoalRepo },
        { provide: getRepositoryToken(IepPlanVersion), useValue: mockVersionRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<IepService>(IepService);
    jest.clearAllMocks();
  });

  describe('findPlans', () => {
    it('should return all plans with goals', async () => {
      const plans = [{ id: 1, studentId: 1, goals: [] }];
      mockPlanRepo.find.mockResolvedValue(plans);
      const result = await service.findPlans();
      expect(result).toEqual(plans);
      expect(mockPlanRepo.find).toHaveBeenCalledWith({ relations: ['goals'] });
    });
  });

  describe('findPlansByStudent', () => {
    it('should return plans for a student', async () => {
      const plans = [{ id: 1, studentId: 1, goals: [] }];
      mockPlanRepo.find.mockResolvedValue(plans);
      const result = await service.findPlansByStudent(1);
      expect(result).toEqual(plans);
      expect(mockPlanRepo.find).toHaveBeenCalledWith({
        where: { studentId: 1 },
        relations: ['goals'],
        order: { id: 'DESC' },
      });
    });
  });

  describe('createPlan', () => {
    it('should create a plan', async () => {
      const dto = { studentId: 1, status: 'active' };
      mockPlanRepo.create.mockReturnValue(dto);
      mockPlanRepo.save.mockResolvedValue({ id: 1, ...dto });
      mockVersionRepo.save.mockResolvedValue({ id: 1 });

      const result = await service.createPlan(dto as any);
      expect(result.id).toBe(1);
    });
  });

  describe('createGoal', () => {
    it('should create a goal', async () => {
      const dto = { planId: 1, title: 'هدف 1' };
      mockGoalRepo.create.mockReturnValue(dto);
      mockGoalRepo.save.mockResolvedValue({ id: 1, ...dto });

      const result = await service.createGoal(dto as any);
      expect(result.id).toBe(1);
    });
  });

  describe('updateGoal', () => {
    it('should update a goal', async () => {
      const existing = { id: 1, planId: 1, title: 'قديم', currentPercentage: 0 };
      mockGoalRepo.findOne.mockResolvedValue(existing);
      mockGoalRepo.save.mockResolvedValue({ ...existing, currentPercentage: 50 });

      const result = await service.updateGoal(1, { currentPercentage: 50 } as any);
      expect(result.currentPercentage).toBe(50);
    });

    it('should throw when goal not found', async () => {
      mockGoalRepo.findOne.mockResolvedValue(null);
      await expect(service.updateGoal(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeGoal', () => {
    it('should delete a goal', async () => {
      mockGoalRepo.delete.mockResolvedValue({ affected: 1 });
      await service.removeGoal(1);
      expect(mockGoalRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should throw when goal not found', async () => {
      mockGoalRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.removeGoal(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('generatePlop', () => {
    it('should generate PLOP for autism', async () => {
      const plop = await service.generatePlop(1, 'autism', 'severe');
      expect(plop).toContain('Strengths');
      expect(plop).toContain('Needs');
    });

    it('should generate PLOP for learning disability', async () => {
      const plop = await service.generatePlop(1, 'ld', 'dyslexia');
      expect(plop).toContain('Strengths');
    });

    it('should generate PLOP for unknown disability', async () => {
      const plop = await service.generatePlop(1, '', '');
      expect(plop).toContain('Strengths');
    });
  });

  describe('generateSmartGoal', () => {
    it('should generate an academic goal', async () => {
      const goal = await service.generateSmartGoal(1, 'academic', { name: 'طالب', skill: 'reading', baseline: 30, target: 80 });
      expect(goal).toContain('طالب');
      expect(goal).toContain('reading');
    });

    it('should generate a behavior goal', async () => {
      const goal = await service.generateSmartGoal(1, 'behavior', { behavior: 'hitting', replacement: 'asking for help' });
      expect(goal).toContain('hitting');
    });

    it('should throw for unknown area', async () => {
      await expect(service.generateSmartGoal(1, 'unknown', {})).rejects.toThrow(NotFoundException);
    });
  });
});
