import { Test, TestingModule } from '@nestjs/testing';
import { AbcService } from './abc.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AbcRecord } from './entities/abc-record.entity';

describe('AbcService', () => {
  let service: AbcService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbcService,
        { provide: getRepositoryToken(AbcRecord), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AbcService>(AbcService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an ABC record', async () => {
      const dto = { studentId: 1, antecedent: 'Teacher request', behavior: 'Crying', consequence: 'Removed' };
      mockRepo.create.mockReturnValue(dto);
      mockRepo.save.mockResolvedValue({ id: 1, ...dto, recordedBy: 1 });

      const result = await service.create(dto, 1);
      expect(result.id).toBe(1);
      expect(result.recordedBy).toBe(1);
    });
  });

  describe('getTrend', () => {
    it('should return aggregated trend data', async () => {
      mockRepo.find.mockResolvedValue([
        { id: 1, studentId: 1, antecedent: 'Noise', behavior: 'Screaming', consequence: 'Time-out', location: 'Class', date: '2026-01-01', time: '10:00', notes: '' },
        { id: 2, studentId: 1, antecedent: 'Noise', behavior: 'Screaming', consequence: 'Ignore', location: 'Class', date: '2026-01-02', time: '11:00', notes: '' },
        { id: 3, studentId: 1, antecedent: 'Request', behavior: 'Crying', consequence: 'Comfort', location: 'Playground', date: '2026-01-03', time: '14:00', notes: '' },
      ]);

      const result = await service.getTrend(1);
      expect(result.totalRecords).toBe(3);
      expect(result.behaviorFrequency.Screaming).toBe(2);
      expect(result.behaviorFrequency.Crying).toBe(1);
      expect(result.locationFrequency.Class).toBe(2);
      expect(result.antecedentFrequency.Noise).toBe(2);
    });
  });
});
