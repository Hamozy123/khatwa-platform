import { Controller, Get, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { PrivacyService } from './privacy.service';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';

@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get('logs')
  @Roles(...ROLES.ADMIN_MANAGER_UP)
  findAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.privacyService.findAll(skip ? Number(skip) : 0, take ? Number(take) : 100);
  }

  @Get('logs/student/:studentId')
  @Roles(...ROLES.SCHOOL_ADMIN_UP)
  findByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.privacyService.findByStudent(studentId);
  }

  @Get('logs/user/:userId')
  @Roles(...ROLES.ADMIN_MANAGER_UP)
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.privacyService.findByUser(userId);
  }
}
