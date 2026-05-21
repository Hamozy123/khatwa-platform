import { Body, Controller, Get, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { RtiService } from './rti.service';
import { CreateRtiAssessmentDto } from './dto/create-rti-assessment.dto';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';
import { AuditLogging } from '../core/audit.decorator';

@Controller('rti')
export class RtiController {
  constructor(private readonly rtiService: RtiService) {}

  @Post()
  @Roles(...ROLES.SCHOOL_ADMIN_UP)
  @AuditLogging({ action: 'CREATE', resource: 'rti_assessment' })
  create(@Body() dto: CreateRtiAssessmentDto, @Req() req: Request) {
    return this.rtiService.create(dto);
  }

  @Get()
  @Roles(...ROLES.ALL)
  findAll() {
    return this.rtiService.findAll();
  }

  @Get('student/:studentId')
  @Roles(...ROLES.ALL)
  findByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.rtiService.findByStudent(studentId);
  }

  @Get('suggest/:studentId')
  @Roles(...ROLES.ALL)
  suggest(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.rtiService.suggestForStudent(studentId);
  }
}
