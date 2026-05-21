import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Notification } from './notification.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  const mockLogger = { info: jest.fn(), warn: jest.fn() };

  const mockNotif = {
    id: 1,
    userId: 1,
    title: 'إشعار',
    body: 'نص الإشعار',
    type: 'info',
    isRead: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: mockRepo },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const dto = { userId: 1, title: 'ترحيب', body: 'مرحباً', type: 'info' };
      mockRepo.create.mockReturnValue(dto);
      mockRepo.save.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto);
      expect(result.id).toBe(1);
      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('findByUser', () => {
    it('should return notifications for user', async () => {
      mockRepo.find.mockResolvedValue([mockNotif]);
      const result = await service.findByUser(1);
      expect(result).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });

    it('should respect limit parameter', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.findByUser(1, 10);
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockRepo.update.mockResolvedValue({ affected: 1 });
      await service.markAsRead(1, 1);
      expect(mockRepo.update).toHaveBeenCalledWith(
        { id: 1, userId: 1 },
        { isRead: true },
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all as read', async () => {
      mockRepo.update.mockResolvedValue({ affected: 3 });
      await service.markAllAsRead(1);
      expect(mockRepo.update).toHaveBeenCalledWith(
        { userId: 1, isRead: false },
        { isRead: true },
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockRepo.count.mockResolvedValue(5);
      const result = await service.getUnreadCount(1);
      expect(result).toBe(5);
    });
  });
});
