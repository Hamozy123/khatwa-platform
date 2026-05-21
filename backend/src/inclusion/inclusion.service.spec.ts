import { Test, TestingModule } from '@nestjs/testing';
import { InclusionService } from './inclusion.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import { Accommodation } from './accommodation.entity';
import { NotFoundException } from '@nestjs/common';

describe('InclusionService', () => {
  let service: InclusionService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockLogger = { info: jest.fn(), warn: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InclusionService,
        { provide: getRepositoryToken(Accommodation), useValue: mockRepo },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<InclusionService>(InclusionService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create accommodation', async () => {
      const dto = { studentId: 1, accommodationType: 'audio', description: 'سماعات' };
      mockRepo.create.mockReturnValue({ ...dto, createdBy: 1 });
      mockRepo.save.mockResolvedValue({ id: 1, ...dto, createdBy: 1 });

      const result = await service.create(dto, 1);
      expect(result.id).toBe(1);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('findByStudent', () => {
    it('should find by student id', async () => {
      mockRepo.find.mockResolvedValue([{ id: 1, studentId: 1 }]);
      const result = await service.findByStudent(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update accommodation', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 1, accommodationType: 'old', description: 'old' });
      mockRepo.save.mockResolvedValue({ id: 1, accommodationType: 'visual', description: 'new' });

      const result = await service.update(1, { accommodationType: 'visual', description: 'new' });
      expect(result.accommodationType).toBe('visual');
    });

    it('should throw when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete accommodation', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1 });
      await service.remove(1);
      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should throw when not found', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
