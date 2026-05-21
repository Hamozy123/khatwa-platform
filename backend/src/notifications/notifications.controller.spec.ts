import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockService = {
    create: jest.fn(),
    findByUser: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
  };

  const mockReq = { user: { userId: 1 } } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: mockService }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  it('create', async () => {
    const dto = { userId: 1, title: 'test' } as any;
    mockService.create.mockResolvedValue({ id: 1 });
    await controller.create(dto);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('findMyNotifications', async () => {
    mockService.findByUser.mockResolvedValue([]);
    await controller.findMyNotifications(mockReq, '10');
    expect(mockService.findByUser).toHaveBeenCalledWith(1, 10);
  });

  it('unreadCount', async () => {
    mockService.getUnreadCount.mockResolvedValue(3);
    const result = await controller.unreadCount(mockReq);
    expect(result).toBe(3);
    expect(mockService.getUnreadCount).toHaveBeenCalledWith(1);
  });

  it('markRead', async () => {
    mockService.markAsRead.mockResolvedValue(undefined);
    await controller.markRead(1, mockReq);
    expect(mockService.markAsRead).toHaveBeenCalledWith(1, 1);
  });

  it('markAllRead', async () => {
    mockService.markAllAsRead.mockResolvedValue(undefined);
    await controller.markAllRead(mockReq);
    expect(mockService.markAllAsRead).toHaveBeenCalledWith(1);
  });
});
