import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req } from '@nestjs/common';
import { Request } from 'express';
import { FbaService } from './fba.service';
import { CreateFbaDto } from './dto/create-fba.dto';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';
import { AuditLogging } from '../core/audit.decorator';

@Controller('fba')
export class FbaController {
  constructor(private readonly fbaService: FbaService) {}

  @Post()
  @Roles(...ROLES.SCHOOL_ADMIN_UP)
  @AuditLogging({ action: 'CREATE', resource: 'fba' })
  create(@Body() dto: CreateFbaDto, @Req() req: Request) {
    return this.fbaService.create(dto, (req as any).user?.id || 0);
  }

  @Get('student/:studentId')
  @Roles(...ROLES.ALL)
  findByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.fbaService.findByStudent(studentId);
  }

  @Get(':id')
  @Roles(...ROLES.ALL)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fbaService.findOne(id);
  }

  @Put(':id')
  @Roles(...ROLES.SCHOOL_ADMIN_UP)
  @AuditLogging({ action: 'UPDATE', resource: 'fba', resourceIdParam: 'id' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateFbaDto>) {
    return this.fbaService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...ROLES.ADMIN_MANAGER_UP)
  @AuditLogging({ action: 'DELETE', resource: 'fba', resourceIdParam: 'id' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fbaService.remove(id);
  }
}
