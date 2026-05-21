import { Controller, Get, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';
import { Request } from 'express';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Roles(...ROLES.ALL)
  getAnalytics(@Req() req: Request) {
    return this.dashboardService.getAnalytics((req as any).user);
  }
}
