import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';
import { Request } from 'express';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(...ROLES.ALL)
  create(@Body() dto: CreateAttendanceDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.attendanceService.create(dto, userId);
  }

  @Post('bulk')
  @Roles(...ROLES.ALL)
  bulkCreate(@Body() dto: BulkAttendanceDto, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.attendanceService.bulkCreate(dto, userId);
  }

  @Get()
  @Roles(...ROLES.ALL)
  findByDate(@Query('date') date: string) {
    return this.attendanceService.findByDate(date);
  }

  @Get('summary')
  @Roles(...ROLES.ALL)
  getSummary(@Query('date') date: string) {
    return this.attendanceService.getSummary(date);
  }

  @Get('student/:studentId')
  @Roles(...ROLES.ALL)
  findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendanceService.findByStudent(studentId, from, to);
  }

  @Get(':id')
  @Roles(...ROLES.ALL)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attendanceService.findOne(id);
  }

  @Patch(':id')
  @Roles(...ROLES.ALL)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...ROLES.DELETE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.attendanceService.remove(id);
  }
}
