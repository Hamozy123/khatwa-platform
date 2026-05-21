import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Media } from './media.entity';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('MediaService', () => {
  let service: MediaService;

  const mockMedia = {
    id: 1,
    originalName: 'test.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    storagePath: path.resolve('uploads/test-uuid.pdf'),
    tags: 'ملف',
    studentId: null,
    uploadedBy: 1,
  };

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockLogger = { info: jest.fn(), warn: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: getRepositoryToken(Media), useValue: mockRepo },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  describe('upload', () => {
    it('should upload a file', async () => {
      const file = { originalname: 'test.pdf', mimetype: 'application/pdf', size: 1024, buffer: Buffer.from('test') } as Express.Multer.File;
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      mockRepo.create.mockReturnValue(mockMedia);
      mockRepo.save.mockResolvedValue(mockMedia as any);

      const result = await service.upload(file, { tags: 'ملف', uploadedBy: 1 });
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return media with filters', async () => {
      mockRepo.find.mockResolvedValue([mockMedia]);
      const result = await service.findAll('ملف');
      expect(result).toHaveLength(1);
    });

    it('should filter by studentId', async () => {
      mockRepo.find.mockResolvedValue([mockMedia]);
      await service.findAll(undefined, 1);
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { studentId: 1 },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return media by id', async () => {
      mockRepo.findOne.mockResolvedValue(mockMedia);
      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    });

    it('should throw when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFilePath', () => {
    it('should return media if file exists on disk', async () => {
      mockRepo.findOne.mockResolvedValue(mockMedia);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.getFilePath(1);
      expect(result.id).toBe(1);
    });

    it('should throw if file missing on disk', async () => {
      mockRepo.findOne.mockResolvedValue(mockMedia);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(service.getFilePath(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete media and file from disk', async () => {
      mockRepo.findOne.mockResolvedValue(mockMedia);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
      mockRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockMedia.storagePath);
      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should handle file already deleted from disk', async () => {
      mockRepo.findOne.mockResolvedValue(mockMedia);
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      mockRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });
});
