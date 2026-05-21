import { Test, TestingModule } from '@nestjs/testing';
import { ParentService } from './parent.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Parent } from './entities/parent.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('ParentService', () => {
  let service: ParentService;

  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    manager: { find: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentService,
        { provide: getRepositoryToken(Parent), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ParentService>(ParentService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a parent', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue({ fullName: 'Parent', phone: '123', pinHash: 'salt:hash' });
      mockRepo.save.mockResolvedValue({ id: 1, fullName: 'Parent', phone: '123' });

      const result = await service.create({ fullName: 'Parent', phone: '123', pin: '1234' });
      expect(result.id).toBe(1);
    });

    it('should throw when phone exists', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 1, phone: '123' });
      await expect(service.create({ fullName: 'P', phone: '123', pin: '1234' })).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return token on valid credentials', async () => {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync('1234', salt, 1000, 64, 'sha512').toString('hex');
      mockRepo.findOne.mockResolvedValue({ id: 1, phone: '123', pinHash: `${salt}:${hash}`, active: true, fullName: 'Parent' });
      mockRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.login({ phone: '123', pin: '1234' });
      expect(result).toHaveProperty('token');
      expect(result.parentId).toBe(1);
      expect(result.fullName).toBe('Parent');
    });

    it('should throw on invalid credentials', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.login({ phone: '999', pin: '1234' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw on inactive parent', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 1, phone: '123', active: false });
      await expect(service.login({ phone: '123', pin: '1234' })).rejects.toThrow(UnauthorizedException);
    });
  });
});
