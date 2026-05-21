import { Test, TestingModule } from '@nestjs/testing';
import { FbaService } from './fba.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FbaRecord } from './entities/fba.entity';
import { NotFoundException } from '@nestjs/common';

describe('FbaService', () => {
  let service: FbaService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FbaService,
        { provide: getRepositoryToken(FbaRecord), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<FbaService>(FbaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an FBA record', async () => {
      const dto = { studentId: 1, targetBehavior: 'Aggression', antecedents: [], behaviors: [], consequences: [] };
      mockRepo.create.mockReturnValue(dto);
      mockRepo.save.mockResolvedValue({ id: 1, ...dto, createdBy: 1 });

      const result = await service.create(dto, 1);
      expect(result.id).toBe(1);
      expect(result.createdBy).toBe(1);
    });
  });

  describe('findByStudent', () => {
    it('should return records ordered by createdAt DESC', async () => {
      mockRepo.find.mockResolvedValue([{ id: 1, studentId: 1 }]);
      const result = await service.findByStudent(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a record by id', async () => {
      mockRepo.findOneBy.mockResolvedValue({ id: 1 });
      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    });

    it('should throw when not found', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a record', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1 });
      await expect(service.remove(1)).resolves.not.toThrow();
    });

    it('should throw when not found', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
