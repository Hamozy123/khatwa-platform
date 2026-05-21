import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { DailyPlanService } from './daily-plan.service';
import { CreateDailyPlanDto } from './dto/create-daily-plan.dto';
import { UpdateDailyPlanDto } from './dto/update-daily-plan.dto';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';

@Controller('daily-plan')
export class DailyPlanController {
  constructor(private readonly dailyPlanService: DailyPlanService) {}

  @Get()
  @Roles(...ROLES.ALL)
  findAll(@Query('date') date?: string, @Query('studentId') studentId?: string) {
    return this.dailyPlanService.findAll(date, studentId ? Number(studentId) : undefined);
  }

  @Get(':id')
  @Roles(...ROLES.ALL)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dailyPlanService.findOne(id);
  }

  @Put(':id')
  @Roles(...ROLES.ALL)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDailyPlanDto) {
    return this.dailyPlanService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...ROLES.DELETE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.dailyPlanService.remove(id);
  }

  @Post()
  @Roles(...ROLES.ALL)
  create(@Body() dto: CreateDailyPlanDto) {
    return this.dailyPlanService.create(dto);
  }
}