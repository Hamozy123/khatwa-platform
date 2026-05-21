import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';
import { AuditLogging } from '../core/audit.decorator';

@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @Roles(...ROLES.ALL)
  findAll(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.studentsService.findAll({ search, skip: skip ? Number(skip) : undefined, take: take ? Number(take) : undefined, user: (req as any).user });
  }

  @Get(':id')
  @Roles(...ROLES.ALL)
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.studentsService.findOne(id, (req as any).user);
  }

  @Get(':id/export')
  @Roles(...ROLES.ALL)
  async export(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const student = await this.studentsService.findOne(id);
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    const tables = ['iep_plans', 'iep_goals', 'behavior_assessments', 'abc_records', 'fba_records', 'rti_assessments', 'risk_events'];
    const data: Record<string, any> = { student: { id: student.id, fullName: student.fullName, disabilityType: student.disabilityType, status: student.status, rtiTier: student.rtiTier, riskScore: student.riskScore } };

    for (const table of tables) {
      try {
        data[table] = await this.dataSource.query(`SELECT * FROM ${table} WHERE "studentId" = $1`, [Number(id)]);
      } catch { data[table] = []; }
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=student-${id}-export.json`);
    res.json(data);
  }

  @Post()
  @Roles(...ROLES.ALL)
  @AuditLogging({ action: 'CREATE', resource: 'student' })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Put(':id')
  @Roles(...ROLES.ALL)
  @AuditLogging({ action: 'UPDATE', resource: 'student', resourceIdParam: 'id' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateStudentDto: CreateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @Roles(...ROLES.DELETE)
  @AuditLogging({ action: 'DELETE', resource: 'student', resourceIdParam: 'id' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }
}
