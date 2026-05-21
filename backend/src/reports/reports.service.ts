import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Repository, In } from 'typeorm';
import PDFDocument from 'pdfkit';
import * as arabicReshapper from 'arabic-reshaper';
import { Student } from '../students/student.entity';
import { IepPlan } from '../iep/entities/iep-plan.entity';
import { IepGoal } from '../iep/entities/iep-goal.entity';
import { RtiAssessment } from '../rti/entities/rti-assessment.entity';
import { FbaRecord } from '../fba/entities/fba.entity';
import { AbcRecord } from '../abc/entities/abc-record.entity';
import { Attendance } from '../attendance/attendance.entity';
import { buildScopeFilter } from '../core/scope.utils';

const DONE_STATUSES = ['done', 'completed', 'achieved', 'منجز'];

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(IepPlan)
    private readonly iepPlanRepository: Repository<IepPlan>,
    @InjectRepository(IepGoal)
    private readonly iepGoalRepository: Repository<IepGoal>,
    @InjectRepository(RtiAssessment)
    private readonly rtiRepository: Repository<RtiAssessment>,
    @InjectRepository(FbaRecord)
    private readonly fbaRepository: Repository<FbaRecord>,
    @InjectRepository(AbcRecord)
    private readonly abcRepository: Repository<AbcRecord>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  private isDoneStatus(status: string | undefined) {
    if (!status) return false;
    return DONE_STATUSES.includes(status.trim().toLowerCase());
  }

  private ar(txt: string): string {
    const shaped = arabicReshapper.convertArabic(txt);
    return shaped.split(/(\s+)/).reverse().join('');
  }

  private setupFont(doc: any) {
    const fontPath = require('path').join(process.cwd(), 'fonts/arial.ttf');
    doc.registerFont('Arabic', fontPath);
    doc.font('Arabic');
    const origText = doc.text.bind(doc);
    doc.text = (text: string, options?: any) => {
      if (text && /[\uFE70-\uFEFF\u0600-\u06FF]/.test(text)) {
        options = { align: 'right', width: 512, ...options };
      }
      return options ? origText(text, options) : origText(text);
    };
  }

  private async makePdf(build: (doc: any) => void): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });
    this.setupFont(doc);
    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      build(doc);
      doc.end();
    });
  }

  async getSummary(user?: any) {
    const scope = buildScopeFilter(user);
    const studentWhere: any = { ...scope };

    const students = await this.studentRepository.count({ where: studentWhere });

    let activeIepPlans = 0;
    let goalsTotal = 0;
    let objectivesCompleted = 0;

    if (scope.schoolName || scope.directorate) {
      const scopedStudentIds = (await this.studentRepository.find({ where: scope, select: ['id'] })).map(s => s.id);
      if (scopedStudentIds.length > 0) {
        activeIepPlans = await this.iepPlanRepository
          .createQueryBuilder('p')
          .where('(p.status IS NULL OR LOWER(p.status) NOT IN (:...arch)) AND p.studentId IN (:...ids)', { arch: ['archived', 'closed'], ids: scopedStudentIds })
          .getCount();
        const planIds = (await this.iepPlanRepository.find({ where: { studentId: In(scopedStudentIds) }, select: ['id'] })).map(p => p.id);
        if (planIds.length > 0) {
          const scopedGoals = await this.iepGoalRepository.find({ where: { planId: In(planIds) } });
          goalsTotal = scopedGoals.length;
          objectivesCompleted = scopedGoals.filter((g) => this.isDoneStatus(g.status)).length;
        }
      }
    } else {
      activeIepPlans = await this.iepPlanRepository
        .createQueryBuilder('p')
        .where('p.status IS NULL OR LOWER(p.status) NOT IN (:...arch)', { arch: ['archived', 'closed'] })
        .getCount();
      const allGoals = await this.iepGoalRepository.find();
      goalsTotal = allGoals.length;
      objectivesCompleted = allGoals.filter((g) => this.isDoneStatus(g.status)).length;
    }

    const weeklyAchievementPercent =
      goalsTotal > 0 ? Math.round((objectivesCompleted / goalsTotal) * 100) : 0;

    const raw = await this.iepGoalRepository.query(
      `SELECT ("updatedAt"::date)::text AS day, COUNT(*)::int AS updates
       FROM iep_goals
       WHERE "updatedAt" >= (CURRENT_DATE - INTERVAL '6 days')
       GROUP BY 1 ORDER BY 1`,
    );

    const countByDay = new Map<string, number>();
    for (const row of raw as { day: string; updates: number }[]) {
      countByDay.set(row.day, Number(row.updates));
    }

    const weeklyProgress: { day: string; label: string; updates: number }[] = [];
    const formatter = new Intl.DateTimeFormat('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' });
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-CA');
      weeklyProgress.push({
        day: key,
        label: formatter.format(d),
        updates: countByDay.get(key) ?? 0,
      });
    }

    return {
      students,
      activeIepPlans,
      objectivesCompleted,
      goalsTotal,
      weeklyAchievementPercent,
      weeklyProgress,
    };
  }

  async generateIepPdf(studentId: number): Promise<Buffer> {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('الطالب غير موجود');

    const plans = await this.iepPlanRepository.find({
      where: { studentId },
      relations: ['goals'],
      order: { id: 'DESC' },
    });

    this.logger.info('iep pdf generated', { studentId, plansCount: plans.length });
    return this.makePdf((doc) => {
      doc.fontSize(18).text(this.ar('تقرير خطة IEP'), { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(this.ar(`الطالب: ${student.fullName}`));
      doc.text(this.ar(`نوع الإعاقة: ${student.disabilityType || '—'}`));
      doc.text(this.ar(`التشخيص: ${student.diagnosis || '—'}`));
      doc.text(this.ar(`مستوى RTI: ${student.rtiTier || '—'}`));
      doc.text(this.ar(`درجة المخاطر: ${student.riskScore ?? 0}`));
      doc.moveDown();
      doc.fontSize(10).text(this.ar(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`));
      doc.moveDown(2);

      if (plans.length === 0) {
        doc.text(this.ar('لا توجد خطط IEP مسجلة لهذا الطالب.'));
      } else {
        for (const plan of plans) {
          doc.fontSize(14).text(this.ar(`خطة #${plan.id} — ${plan.status || 'نشط'}`), { underline: true });
          doc.fontSize(10).text(this.ar(`من: ${plan.startDate || '—'}  إلى: ${plan.endDate || '—'}`));
          doc.moveDown(0.5);
          if (plan.plop) {
            doc.fontSize(10).text(this.ar(`PLOP: ${plan.plop.substring(0, 200)}...`));
            doc.moveDown(0.5);
          }
          if (plan.goals && plan.goals.length > 0) {
            doc.fontSize(11).text(this.ar('الأهداف:'));
            for (const goal of plan.goals) {
              const bar = '█'.repeat(Math.round((goal.currentPercentage || 0) / 10)) + '░'.repeat(10 - Math.round((goal.currentPercentage || 0) / 10));
              doc.fontSize(9).text(this.ar(`  - ${goal.title} [${goal.currentPercentage || 0}%] ${bar} (${goal.status})`));
            }
          } else {
            doc.fontSize(9).text(this.ar('  لا توجد أهداف مسجلة.'));
          }
          doc.moveDown();
        }
      }
    });
  }

  async generateRtiReport(studentId: number): Promise<Buffer> {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('الطالب غير موجود');

    const assessments = await this.rtiRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });

    return this.makePdf((doc) => {
      doc.fontSize(18).text(this.ar('تقرير الاستجابة للتدخل (RTI)'), { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(this.ar(`الطالب: ${student.fullName}`));
      doc.text(this.ar(`المستوى الحالي: المستوى ${student.rtiTier}`));
      doc.moveDown();
      doc.fontSize(10).text(this.ar(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`));
      doc.moveDown(2);

      if (assessments.length === 0) {
        doc.text(this.ar('لا توجد تقييمات RTI مسجلة.'));
      } else {
        doc.fontSize(12).text(this.ar('تاريخ التغييرات:'), { underline: true });
        doc.moveDown();
        for (const a of assessments) {
          const date = new Date(a.createdAt).toLocaleDateString('ar-EG');
          doc.fontSize(10).text(this.ar(`  ${date} — المستوى ${a.previousTier} ← المستوى ${a.newTier}`));
          if (a.reason) doc.fontSize(9).text(this.ar(`    السبب: ${a.reason}`));
          doc.moveDown(0.3);
        }
      }

      doc.moveDown(2);
      doc.fontSize(12).text(this.ar(`التوصية: المستوى ${student.rtiTier} — ${student.rtiTier === 1 ? 'تدخل وقائي عام' : student.rtiTier === 2 ? 'تدخل موجّه' : 'تدخل مكثف فردي'}`));
    });
  }

  async generateFbaReport(fbaId: number): Promise<Buffer> {
    const fba = await this.fbaRepository.findOneBy({ id: fbaId });
    if (!fba) throw new NotFoundException('تقرير FBA غير موجود');

    const student = await this.studentRepository.findOneBy({ id: fba.studentId });

    return this.makePdf((doc) => {
      doc.fontSize(18).text(this.ar('تقرير تقييم السلوك الوظيفي (FBA)'), { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(this.ar(`الطالب: ${student?.fullName || '—'}`));
      doc.text(this.ar(`تاريخ: ${fba.date || '—'}`));
      doc.moveDown(2);

      if (fba.targetBehavior) {
        doc.fontSize(12).text(this.ar(`السلوك المستهدف: ${fba.targetBehavior}`), { underline: true });
        doc.moveDown();
      }

      if (fba.antecedents?.length) {
        doc.fontSize(12).text(this.ar('المحفزات السابقة (Antecedents):'), { underline: true });
        for (const a of fba.antecedents) {
          doc.fontSize(10).text(this.ar(`  - ${a.description} (التكرار: ${a.frequency})`));
        }
        doc.moveDown();
      }

      if (fba.behaviors?.length) {
        doc.fontSize(12).text(this.ar('السلوكيات (Behaviors):'), { underline: true });
        for (const b of fba.behaviors) {
          doc.fontSize(10).text(this.ar(`  - ${b.description}${b.intensity ? ` (الشدة: ${b.intensity})` : ''}`));
        }
        doc.moveDown();
      }

      if (fba.consequences?.length) {
        doc.fontSize(12).text(this.ar('النتائج (Consequences):'), { underline: true });
        for (const c of fba.consequences) {
          doc.fontSize(10).text(this.ar(`  - ${c.description}${c.effectiveness ? ` (الفعالية: ${c.effectiveness})` : ''}`));
        }
        doc.moveDown();
      }

      if (fba.hypothesis) {
        doc.fontSize(12).text(this.ar('الفرضية:'), { underline: true });
        doc.fontSize(10).text(this.ar(`  ${fba.hypothesis}`));
        doc.moveDown();
      }

      if (fba.bip) {
        doc.fontSize(14).text(this.ar('خطة التدخل السلوكي (BIP)'), { underline: true });
        doc.moveDown();
        doc.fontSize(11).text(this.ar(`السلوك البديل: ${fba.bip.replacementBehavior}`));
        doc.moveDown();
        doc.fontSize(11).text(this.ar('استراتيجيات التدخل:'));
        for (const s of fba.bip.interventionStrategies || []) {
          doc.fontSize(10).text(this.ar(`  - ${s}`));
        }
        doc.moveDown();
        doc.fontSize(11).text(this.ar(`خطة التعزيز: ${fba.bip.reinforcementPlan}`));
        if (fba.bip.crisisPlan) {
          doc.moveDown();
          doc.fontSize(11).text(this.ar(`خطة الأزمات: ${fba.bip.crisisPlan}`));
        }
        if (fba.bip.reviewDate) {
          doc.text(this.ar(`تاريخ المراجعة: ${fba.bip.reviewDate}`));
        }
      }
    });
  }

  async generateComprehensiveReport(studentId: number): Promise<Buffer> {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('الطالب غير موجود');

    const plans = await this.iepPlanRepository.find({ where: { studentId }, relations: ['goals'], order: { id: 'DESC' } });
    const rtiHistory = await this.rtiRepository.find({ where: { studentId }, order: { createdAt: 'DESC' } });
    const fbas = await this.fbaRepository.find({ where: { studentId }, order: { createdAt: 'DESC' } });
    const abcs = await this.abcRepository.find({ where: { studentId }, order: { createdAt: 'DESC' } });

    return this.makePdf((doc) => {
      doc.fontSize(18).text(this.ar('التقرير الشامل للطالب'), { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(this.ar('البيانات الأساسية'), { underline: true });
      doc.fontSize(11).text(this.ar(`الاسم: ${student.fullName}`));
      doc.text(this.ar(`نوع الإعاقة: ${student.disabilityType || '—'}`));
      doc.text(this.ar(`التشخيص: ${student.diagnosis || '—'}`));
      doc.text(this.ar(`المستوى RTI: ${student.rtiTier || '—'}`));
      doc.text(this.ar(`درجة المخاطر: ${student.riskScore ?? 0}`));
      doc.text(this.ar(`الحالة: ${student.status || '—'}`));
      doc.moveDown();

      doc.fontSize(14).text(this.ar('خطط IEP'), { underline: true });
      if (plans.length === 0) {
        doc.fontSize(10).text(this.ar('لا توجد خطط.'));
      } else {
        for (const p of plans) {
          doc.fontSize(11).text(this.ar(`- خطة #${p.id} (${p.status || 'نشط'}) — ${p.goals?.length || 0} هدف`));
        }
      }
      doc.moveDown();

      doc.fontSize(14).text(this.ar('تاريخ RTI'), { underline: true });
      if (rtiHistory.length === 0) {
        doc.fontSize(10).text(this.ar('لا يوجد تاريخ.'));
      } else {
        for (const r of rtiHistory) {
          doc.fontSize(10).text(this.ar(`  - المستوى ${r.previousTier} ← ${r.newTier} (${new Date(r.createdAt).toLocaleDateString('ar-EG')})`));
        }
      }
      doc.moveDown();

      doc.fontSize(14).text(this.ar('تقييمات السلوك (FBA)'), { underline: true });
      if (fbas.length === 0) {
        doc.fontSize(10).text(this.ar('لا توجد تقييمات.'));
      } else {
        for (const f of fbas) {
          doc.fontSize(10).text(this.ar(`  - FBA #${f.id}: ${f.targetBehavior || '—'} (${f.date || '—'})`));
        }
      }
      doc.moveDown();

      doc.fontSize(14).text(this.ar('سجل ABC'), { underline: true });
      if (abcs.length === 0) {
        doc.fontSize(10).text(this.ar('لا توجد سجلات.'));
      } else {
        doc.fontSize(10).text(this.ar(`إجمالي السجلات: ${abcs.length}`));
        const topBehaviors = Object.entries(
          abcs.reduce((acc, r) => { acc[r.behavior] = (acc[r.behavior] || 0) + 1; return acc; }, {} as Record<string, number>)
        ).sort((a, b) => b[1] - a[1]).slice(0, 5);
        doc.fontSize(10).text(this.ar('السلوكيات الأكثر تكراراً:'));
        for (const [beh, count] of topBehaviors) {
          doc.fontSize(9).text(this.ar(`  - ${beh} (${count} مرات)`));
        }
      }

      doc.fontSize(14).text(this.ar(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`), { align: 'center' });
    });
  }

  async getAttendanceReport(from: string, to: string): Promise<{
    summary: { present: number; absent: number; late: number; excused: number; total: number };
    daily: { date: string; present: number; absent: number; late: number; total: number }[];
    studentDetails: { studentId: number; studentName: string; present: number; absent: number; late: number; excused: number }[];
  }> {
    const records = await this.attendanceRepository
      .createQueryBuilder('a')
      .where('a.date >= :from AND a.date <= :to', { from, to })
      .orderBy('a.date', 'ASC')
      .addOrderBy('a.studentId', 'ASC')
      .getMany();

    const students = await this.studentRepository.find({ select: ['id', 'fullName'] });
    const studentMap = new Map(students.map(s => [s.id, s.fullName]));

    const summary = { present: 0, absent: 0, late: 0, excused: 0, total: records.length };
    const byDate = new Map<string, { present: number; absent: number; late: number; total: number }>();
    const byStudent = new Map<number, { studentId: number; studentName: string; present: number; absent: number; late: number; excused: number }>();

    for (const r of records) {
      if (r.status === 'present') summary.present++;
      else if (r.status === 'absent') summary.absent++;
      else if (r.status === 'late') summary.late++;
      else if (r.status === 'excused') summary.excused++;

      if (!byDate.has(r.date)) byDate.set(r.date, { present: 0, absent: 0, late: 0, total: 0 });
      const day = byDate.get(r.date)!;
      day.total++;
      if (r.status === 'present') day.present++;
      else if (r.status === 'absent') day.absent++;
      else if (r.status === 'late') day.late++;

      if (!byStudent.has(r.studentId)) byStudent.set(r.studentId, { studentId: r.studentId, studentName: studentMap.get(r.studentId) || `طالب #${r.studentId}`, present: 0, absent: 0, late: 0, excused: 0 });
      const stu = byStudent.get(r.studentId)!;
      if (r.status === 'present') stu.present++;
      else if (r.status === 'absent') stu.absent++;
      else if (r.status === 'late') stu.late++;
      else if (r.status === 'excused') stu.excused++;
    }

    const daily = Array.from(byDate.entries()).map(([date, data]) => ({ date, ...data }));
    const studentDetails = Array.from(byStudent.values());

    return { summary, daily, studentDetails };
  }

  async generateAttendanceCsv(studentId: number): Promise<string> {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('الطالب غير موجود');

    const headers = 'student_id,student_name,date,status\n';
    const rows = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 5 || dayOfWeek === 6) continue;
      rows.push(`${studentId},"${student.fullName}",${dateStr},present`);
    }
    return headers + rows.join('\n');
  }

  async generateAttendanceCsvExport(from: string, to: string, studentId?: number): Promise<string> {
    const where: any = {};
    if (studentId) where.studentId = studentId;
    const records = await this.attendanceRepository
      .createQueryBuilder('a')
      .where('a.date >= :from AND a.date <= :to', { from, to })
      .andWhere(studentId ? 'a.studentId = :studentId' : '1=1', { studentId })
      .orderBy('a.date', 'ASC')
      .addOrderBy('a.studentId', 'ASC')
      .getMany();

    const studentIds = [...new Set(records.map(r => r.studentId))];
    const students = studentIds.length > 0 ? await this.studentRepository.find({ where: { id: In(studentIds) }, select: ['id', 'fullName'] }) : [];
    const studentMap = new Map(students.map(s => [s.id, s.fullName]));

    const headers = 'student_id,student_name,date,status,check_in,notes\n';
    const rows = records.map(r =>
      `${r.studentId},"${studentMap.get(r.studentId) || ''}",${r.date},${r.status},${r.checkIn || ''},${(r.notes || '').replace(/"/g, '""')}`
    );
    return '\uFEFF' + headers + rows.join('\n');
  }

  async getStudentStats(): Promise<{
    byDisabilityType: { label: string; count: number }[];
    byStatus: { label: string; count: number }[];
    byRtiTier: { label: string; count: number }[];
  }> {
    const students = await this.studentRepository.find();

    const disabilityTypes = new Map<string, number>();
    const statuses = new Map<string, number>();
    const rtiTiers = new Map<string, number>();

    for (const s of students) {
      const dt = s.disabilityType || 'غير محدد';
      disabilityTypes.set(dt, (disabilityTypes.get(dt) || 0) + 1);
      const st = s.status || 'غير محدد';
      statuses.set(st, (statuses.get(st) || 0) + 1);
      const rt = `المستوى ${s.rtiTier}`;
      rtiTiers.set(rt, (rtiTiers.get(rt) || 0) + 1);
    }

    return {
      byDisabilityType: Array.from(disabilityTypes.entries()).map(([label, count]) => ({ label, count })),
      byStatus: Array.from(statuses.entries()).map(([label, count]) => ({ label, count })),
      byRtiTier: Array.from(rtiTiers.entries()).map(([label, count]) => ({ label, count })),
    };
  }
}
