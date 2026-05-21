import { Test, TestingModule } from '@nestjs/testing';
import { PrivacyService } from './privacy.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PiiAccessLog } from './pii-access-log.entity';

describe('PrivacyService', () => {
  let service: PrivacyService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivacyService,
        { provide: getRepositoryToken(PiiAccessLog), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PrivacyService>(PrivacyService);
    jest.clearAllMocks();
  });

  describe('logAccess', () => {
    it('should save an access log entry', async () => {
      mockRepo.create.mockReturnValue({ userId: 1, action: 'GET' });
      mockRepo.save.mockResolvedValue({ id: 1, userId: 1, action: 'GET' });

      const result = await service.logAccess({ userId: 1, action: 'GET', resource: '/students/1', resourceId: 1, userRole: 'teacher_m' });
      expect(result.id).toBe(1);
    });
  });

  describe('findByStudent', () => {
    it('should return logs for a student', async () => {
      mockRepo.find.mockResolvedValue([{ id: 1, studentId: 1 }]);
      const result = await service.findByStudent(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('findByUser', () => {
    it('should return logs for a user', async () => {
      mockRepo.find.mockResolvedValue([{ id: 1, userId: 1 }]);
      const result = await service.findByUser(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('should return paginated logs', async () => {
      mockRepo.find.mockResolvedValue([{ id: 1 }]);
      const result = await service.findAll(0, 10);
      expect(result).toHaveLength(1);
    });
  });
});
