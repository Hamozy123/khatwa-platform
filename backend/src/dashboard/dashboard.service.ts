import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student } from '../students/student.entity';
import { Attendance } from '../attendance/attendance.entity';
import { IepPlan } from '../iep/entities/iep-plan.entity';
import { IepGoal } from '../iep/entities/iep-goal.entity';
import { RiskEvent } from '../early-warning/entities/risk-event.entity';
import { buildScopeFilter } from '../core/scope.utils';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(IepPlan)
    private readonly iepPlanRepository: Repository<IepPlan>,
    @InjectRepository(IepGoal)
    private readonly iepGoalRepository: Repository<IepGoal>,
    @InjectRepository(RiskEvent)
    private readonly riskEventRepository: Repository<RiskEvent>,
  ) {}

  async getAnalytics(user?: any) {
    const scope = buildScopeFilter(user);
    const studentWhere: any = { ...scope };

    const studentsTotal = await this.studentRepository.count({ where: studentWhere });
    const students = await this.studentRepository.find({ where: studentWhere });

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

    const today = new Date().toLocaleDateString('en-CA');
    const attendanceToday = await this.attendanceRepository.find({ where: { date: today } });
    const attSummary = { present: 0, absent: 0, late: 0, excused: 0, total: attendanceToday.length };
    for (const r of attendanceToday) {
      if (r.status === 'present') attSummary.present++;
      else if (r.status === 'absent') attSummary.absent++;
      else if (r.status === 'late') attSummary.late++;
      else if (r.status === 'excused') attSummary.excused++;
    }

    const rawAttTrend = await this.attendanceRepository.query(
      `SELECT date, status, COUNT(*)::int AS count
       FROM attendance
       WHERE date >= (CURRENT_DATE - INTERVAL '6 days')
       GROUP BY date, status ORDER BY date`,
    ) as { date: string; status: string; count: number }[];

    const attByDay = new Map<string, { present: number; absent: number; late: number }>();
    for (const row of rawAttTrend) {
      if (!attByDay.has(row.date)) attByDay.set(row.date, { present: 0, absent: 0, late: 0 });
      const day = attByDay.get(row.date)!;
      if (row.status === 'present') day.present += row.count;
      else if (row.status === 'absent') day.absent += row.count;
      else if (row.status === 'late') day.late += row.count;
    }

    const formatter = new Intl.DateTimeFormat('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' });
    const attendanceTrend: { date: string; label: string; present: number; absent: number; late: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-CA');
      const day = attByDay.get(key) || { present: 0, absent: 0, late: 0 };
      attendanceTrend.push({ date: key, label: formatter.format(d), ...day });
    }

    const flaggedStudents = await this.riskEventRepository.count({ where: { flagged: true } });

    let activeIepPlans = 0;
    let goalsTotal = 0;
    let objectivesCompleted = 0;

    if (students.length > 0) {
      const studentIds = students.map(s => s.id);
      activeIepPlans = await this.iepPlanRepository
        .createQueryBuilder('p')
        .where('(p.status IS NULL OR LOWER(p.status) NOT IN (:...arch)) AND p.studentId IN (:...ids)', { arch: ['archived', 'closed'], ids: studentIds })
        .getCount();
      const planIds = (await this.iepPlanRepository.find({ where: { studentId: In(studentIds) }, select: ['id'] })).map(p => p.id);
      if (planIds.length > 0) {
        const goals = await this.iepGoalRepository.find({ where: { planId: In(planIds) } });
        goalsTotal = goals.length;
        objectivesCompleted = goals.filter((g) => g.status && ['done', 'completed', 'achieved', 'منجز'].includes(g.status.trim().toLowerCase())).length;
      }
    }

    const weeklyAchievementPercent = goalsTotal > 0 ? Math.round((objectivesCompleted / goalsTotal) * 100) : 0;

    return {
      students: {
        total: studentsTotal,
        byDisabilityType: Array.from(disabilityTypes.entries()).map(([label, count]) => ({ label, count })),
        byStatus: Array.from(statuses.entries()).map(([label, count]) => ({ label, count })),
        byRtiTier: Array.from(rtiTiers.entries()).map(([label, count]) => ({ label, count })),
      },
      attendance: {
        today: attSummary,
        trend: attendanceTrend,
      },
      iep: {
        activePlans: activeIepPlans,
        objectivesCompleted,
        goalsTotal,
        weeklyAchievementPercent,
      },
      flaggedStudents,
    };
  }
}
