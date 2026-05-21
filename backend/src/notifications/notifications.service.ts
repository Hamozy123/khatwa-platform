import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notif = this.notificationRepository.create(dto);
    const saved = await this.notificationRepository.save(notif);
    this.logger.info('notification created', { notifId: saved.id, userId: dto.userId, type: dto.type });
    return saved;
  }

  async findByUser(userId: number, limit = 50) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(id: number, userId: number) {
    await this.notificationRepository.update({ id, userId }, { isRead: true });
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
  }

  async getUnreadCount(userId: number) {
    return this.notificationRepository.count({ where: { userId, isRead: false } });
  }
}
