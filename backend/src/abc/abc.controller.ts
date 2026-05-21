import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AbcService } from './abc.service';
import { CreateAbcRecordDto } from './dto/create-abc-record.dto';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';
import { AuditLogging } from '../core/audit.decorator';

@Controller('abc')
export class AbcController {
  constructor(private readonly abcService: AbcService) {}

  @Post()
  @Roles(...ROLES.ALL)
  @AuditLogging({ action: 'CREATE', resource: 'abc_record' })
  create(@Body() dto: CreateAbcRecordDto, @Req() req: Request) {
    return this.abcService.create(dto, (req as any).user?.id || 0);
  }

  @Get('student/:studentId')
  @Roles(...ROLES.ALL)
  findByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.abcService.findByStudent(studentId);
  }

  @Get('trend/:studentId')
  @Roles(...ROLES.ALL)
  getTrend(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.abcService.getTrend(studentId);
  }

  @Delete(':id')
  @Roles(...ROLES.ADMIN_MANAGER_UP)
  @AuditLogging({ action: 'DELETE', resource: 'abc_record', resourceIdParam: 'id' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.abcService.remove(id);
  }
}
