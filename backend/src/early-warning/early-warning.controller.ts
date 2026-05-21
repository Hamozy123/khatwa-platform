import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Req } from '@nestjs/common';
import { Request } from 'express';
import { EarlyWarningService } from './early-warning.service';
import { CreateRiskEventDto } from './dto/create-risk-event.dto';
import { UpdateEarlyWarningConfigDto } from './dto/update-early-warning-config.dto';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';
import { AuditLogging } from '../core/audit.decorator';

@Controller('early-warning')
export class EarlyWarningController {
  constructor(private readonly service: EarlyWarningService) {}

  @Get('config')
  @Roles(...ROLES.ADMIN_MANAGER_UP)
  getConfigs() {
    return this.service.getConfigs();
  }

  @Put('config/:id')
  @Roles(...ROLES.ADMIN_MANAGER_UP)
  updateConfig(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEarlyWarningConfigDto) {
    return this.service.updateConfig(id, dto);
  }

  @Post('events')
  @Roles(...ROLES.ALL)
  @AuditLogging({ action: 'CREATE', resource: 'risk_event' })
  recordEvent(@Body() dto: CreateRiskEventDto, @Req() req: Request) {
    return this.service.recordEvent(dto);
  }

  @Get('events/student/:studentId')
  @Roles(...ROLES.ALL)
  getEvents(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.service.getEvents(studentId);
  }

  @Get('flagged')
  @Roles(...ROLES.SCHOOL_ADMIN_UP)
  getFlagged() {
    return this.service.getFlaggedStudents();
  }
}
