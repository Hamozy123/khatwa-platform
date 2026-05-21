import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req } from '@nestjs/common';
import { BehaviorService } from './behavior.service';
import { CreateBehaviorAssessmentDto } from './dto/create-behavior-assessment.dto';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';
import { Request } from 'express';

@Controller('behavior')
export class BehaviorController {
  constructor(private readonly behaviorService: BehaviorService) {}

  @Post('assessments')
  @Roles(...ROLES.ALL)
  create(@Body() dto: CreateBehaviorAssessmentDto, @Req() req: Request) {
    return this.behaviorService.create(dto, (req as any).user.userId);
  }

  @Get('assessments/student/:studentId')
  @Roles(...ROLES.ALL)
  findByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.behaviorService.findByStudent(studentId);
  }

  @Get('trend/:studentId')
  @Roles(...ROLES.ALL)
  getTrend(@Param('studentId', ParseIntPipe) studentId: number, @Query('indicator') indicator: string) {
    return this.behaviorService.getTrend(studentId, indicator);
  }

  @Delete('assessments/:id')
  @Roles(...ROLES.DELETE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.behaviorService.remove(id);
  }
}
