import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';
import { Request } from 'express';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(...ROLES.ALL)
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  @Roles(...ROLES.ALL)
  findMyNotifications(@Req() req: Request, @Query('limit') limit?: string) {
    const userId = (req as any).user.userId;
    return this.notificationsService.findByUser(userId, limit ? Number(limit) : 50);
  }

  @Get('unread-count')
  @Roles(...ROLES.ALL)
  unreadCount(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.notificationsService.getUnreadCount(userId);
  }

  @Put(':id/read')
  @Roles(...ROLES.ALL)
  markRead(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.notificationsService.markAsRead(id, (req as any).user.userId);
  }

  @Put('read-all')
  @Roles(...ROLES.ALL)
  markAllRead(@Req() req: Request) {
    return this.notificationsService.markAllAsRead((req as any).user.userId);
  }
}
