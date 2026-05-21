import { Test, TestingModule } from '@nestjs/testing';
import { BehaviorService } from './behavior.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import { BehaviorAssessment } from './behavior-assessment.entity';

describe('BehaviorService', () => {
  let service: BehaviorService;

  const mockAssessment = {
    id: 1,
    studentId: 1,
    date: '2026-05-01',
    indicators: { attention: 8, response: 7, interaction: 6, agitation: 3, eye_contact: 9 },
    notes: 'ملاحظات',
    createdBy: 1,
  };

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockLogger = { info: jest.fn(), warn: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BehaviorService,
        { provide: getRepositoryToken(BehaviorAssessment), useValue: mockRepo },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<BehaviorService>(BehaviorService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an assessment', async () => {
      const dto = { studentId: 1, date: '2026-05-01', indicators: { attention: 8 }, notes: 'test' };
      mockRepo.create.mockReturnValue({ ...dto, createdBy: 1 });
      mockRepo.save.mockResolvedValue({ id: 1, ...dto, createdBy: 1 });

      const result = await service.create(dto, 1);
      expect(result.id).toBe(1);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('findByStudent', () => {
    it('should return assessments ordered by date desc', async () => {
      mockRepo.find.mockResolvedValue([mockAssessment]);
      const result = await service.findByStudent(1);
      expect(result).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { studentId: 1 },
        order: { date: 'DESC' },
      });
    });
  });

  describe('getTrend', () => {
    it('should return trend for a specific indicator', async () => {
      mockRepo.find.mockResolvedValue([
        { id: 1, studentId: 1, date: '2026-05-01', indicators: { attention: 8 } },
        { id: 2, studentId: 1, date: '2026-05-02', indicators: { attention: 9, response: 5 } },
        { id: 3, studentId: 1, date: '2026-05-03', indicators: { response: 6 } },
      ]);

      const result = await service.getTrend(1, 'attention');
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(8);
      expect(result[1].value).toBe(9);
    });
  });

  describe('remove', () => {
    it('should delete an assessment', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1 });
      await service.remove(1);
      expect(mockRepo.delete).toHaveBeenCalledWith(1);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });
});
