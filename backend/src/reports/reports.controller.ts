import { Controller, Get, Param, ParseIntPipe, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ReportsService } from './reports.service';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @Roles(...ROLES.ALL)
  getSummary(@Req() req: Request) {
    return this.reportsService.getSummary((req as any).user);
  }

  @Get('attendance-report')
  @Roles(...ROLES.ALL)
  getAttendanceReport(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getAttendanceReport(from, to);
  }

  @Get('student-stats')
  @Roles(...ROLES.ALL)
  getStudentStats() {
    return this.reportsService.getStudentStats();
  }

  @Get('attendance/export')
  @Roles(...ROLES.ALL)
  async exportAttendanceCsv(@Query('from') from: string, @Query('to') to: string, @Query('studentId') studentId: string, @Res() res: Response) {
    const csv = await this.reportsService.generateAttendanceCsvExport(from, to, studentId ? Number(studentId) : undefined);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="attendance-${from}-${to}.csv"`,
    });
    res.end(csv);
  }

  @Get('iep/:studentId/pdf')
  @Roles(...ROLES.ALL)
  async getIepPdf(@Param('studentId', ParseIntPipe) studentId: number, @Res() res: Response) {
    const buffer = await this.reportsService.generateIepPdf(studentId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="iep-report-${studentId}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('rti/:studentId/pdf')
  @Roles(...ROLES.ALL)
  async getRtiPdf(@Param('studentId', ParseIntPipe) studentId: number, @Res() res: Response) {
    const buffer = await this.reportsService.generateRtiReport(studentId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="rti-report-${studentId}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('fba/:fbaId/pdf')
  @Roles(...ROLES.ALL)
  async getFbaPdf(@Param('fbaId', ParseIntPipe) fbaId: number, @Res() res: Response) {
    const buffer = await this.reportsService.generateFbaReport(fbaId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="fba-report-${fbaId}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('comprehensive/:studentId/pdf')
  @Roles(...ROLES.ALL)
  async getComprehensivePdf(@Param('studentId', ParseIntPipe) studentId: number, @Res() res: Response) {
    const buffer = await this.reportsService.generateComprehensiveReport(studentId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="comprehensive-report-${studentId}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('attendance/:studentId/csv')
  @Roles(...ROLES.ALL)
  async getAttendanceCsv(@Param('studentId', ParseIntPipe) studentId: number, @Res() res: Response) {
    const csv = await this.reportsService.generateAttendanceCsv(studentId);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="attendance-${studentId}.csv"`,
    });
    res.end(csv);
  }
}
