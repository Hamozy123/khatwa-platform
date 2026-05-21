import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(params: { userId?: number; username?: string; action: string; resource: string; resourceId?: string; details?: Record<string, any>; ipAddress?: string }) {
    const entry = this.auditLogRepository.create(params);
    return this.auditLogRepository.save(entry);
  }

  async findByUser(userId: number, limit = 50) {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByResource(resource: string, resourceId: string, limit = 50) {
    return this.auditLogRepository.find({
      where: { resource, resourceId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
