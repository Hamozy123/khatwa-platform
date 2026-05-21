import { Test, TestingModule } from '@nestjs/testing';
import { EarlyWarningService } from './early-warning.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EarlyWarningConfig } from './entities/early-warning-config.entity';
import { RiskEvent } from './entities/risk-event.entity';
import { Student } from '../students/student.entity';

describe('EarlyWarningService', () => {
  let service: EarlyWarningService;

  const mockConfigRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    clear: jest.fn(),
    save: jest.fn(),
  };

  const mockEventRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockStudentRepo = {
    update: jest.fn(),
    findBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EarlyWarningService,
        { provide: getRepositoryToken(EarlyWarningConfig), useValue: mockConfigRepo },
        { provide: getRepositoryToken(RiskEvent), useValue: mockEventRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
      ],
    }).compile();

    service = module.get<EarlyWarningService>(EarlyWarningService);
    jest.clearAllMocks();
  });

  describe('recordEvent', () => {
    it('should flag event when threshold exceeded', async () => {
      mockConfigRepo.find.mockResolvedValue([{ indicator: 'absenteeism', weight: 3, threshold: 15 }]);
      mockEventRepo.create.mockReturnValue({});
      mockEventRepo.save.mockResolvedValue({ id: 1, studentId: 1, indicator: 'absenteeism', value: 10, weightedScore: 30, flagged: true });
      mockEventRepo.find.mockResolvedValue([{ weightedScore: 30 }]);
      mockStudentRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.recordEvent({ studentId: 1, indicator: 'absenteeism', value: 10 });

      expect(result.flagged).toBe(true);
      expect(result.weightedScore).toBe(30);
      expect(mockStudentRepo.update).toHaveBeenCalled();
    });

    it('should not flag event when below threshold', async () => {
      mockConfigRepo.find.mockResolvedValue([{ indicator: 'absenteeism', weight: 3, threshold: 100 }]);
      mockEventRepo.create.mockReturnValue({});
      mockEventRepo.save.mockResolvedValue({ id: 2, studentId: 1, indicator: 'absenteeism', value: 10, weightedScore: 30, flagged: false });

      const result = await service.recordEvent({ studentId: 1, indicator: 'absenteeism', value: 10 });

      expect(result.flagged).toBe(false);
    });

    it('should not flag when no config found', async () => {
      mockConfigRepo.find.mockResolvedValue([]);
      mockEventRepo.create.mockReturnValue({});
      mockEventRepo.save.mockResolvedValue({ id: 3, studentId: 1, indicator: 'unknown', value: 10, weightedScore: 10, flagged: false });

      const result = await service.recordEvent({ studentId: 1, indicator: 'unknown', value: 10 });

      expect(result.flagged).toBe(false);
      expect(result.weightedScore).toBe(10);
    });
  });

  describe('getConfigs', () => {
    it('should return active configs', async () => {
      mockConfigRepo.find.mockResolvedValue([{ indicator: 'absenteeism', active: true }]);
      const result = await service.getConfigs();
      expect(result).toHaveLength(1);
    });
  });
});
