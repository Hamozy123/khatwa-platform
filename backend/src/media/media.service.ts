import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Media } from './media.entity';

const UPLOADS_DIR = path.resolve('uploads');

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  async upload(file: Express.Multer.File, dto: { tags?: string; studentId?: number; uploadedBy: number }) {
    const ext = path.extname(file.originalname);
    const storedName = `${uuidv4()}${ext}`;
    const storagePath = path.join(UPLOADS_DIR, storedName);
    fs.writeFileSync(storagePath, file.buffer);

    const media = this.mediaRepository.create({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath,
      tags: dto.tags ?? null,
      studentId: dto.studentId ?? null,
      uploadedBy: dto.uploadedBy,
    } as any);
    const saved = await this.mediaRepository.save(media as any);
    const mediaId = (saved as any).id;
    this.logger.info('media uploaded', { mediaId, originalName: file.originalname, size: file.size });
    return saved as any;
  }

  async findAll(tags?: string, studentId?: number) {
    const where: any = {};
    if (tags) where.tags = tags;
    if (studentId) where.studentId = studentId;
    return this.mediaRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) throw new NotFoundException('الملف غير موجود');
    return media;
  }

  async getFilePath(id: number) {
    const media = await this.findOne(id);
    if (!fs.existsSync(media.storagePath)) {
      throw new NotFoundException('الملف غير موجود على القرص');
    }
    return media;
  }

  async remove(id: number): Promise<void> {
    const media = await this.findOne(id);
    try {
      if (fs.existsSync(media.storagePath)) {
        fs.unlinkSync(media.storagePath);
      }
    } catch (err) {
      this.logger.warn('failed to delete file from disk', { mediaId: id, error: (err as Error).message });
    }
    await this.mediaRepository.delete(id);
    this.logger.info('media deleted', { mediaId: id });
  }
}
