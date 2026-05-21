import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Student } from '../students/student.entity';
import { Attendance } from '../attendance/attendance.entity';
import { IepPlan } from '../iep/entities/iep-plan.entity';
import { IepGoal } from '../iep/entities/iep-goal.entity';
import { RiskEvent } from '../early-warning/entities/risk-event.entity';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockStudentRepo = {
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockAttendanceRepo = {
    find: jest.fn(),
    query: jest.fn(),
  };

  const mockPlanRepo = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };

  const mockGoalRepo = {
    find: jest.fn(),
  };

  const mockRiskRepo = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: getRepositoryToken(Attendance), useValue: mockAttendanceRepo },
        { provide: getRepositoryToken(IepPlan), useValue: mockPlanRepo },
        { provide: getRepositoryToken(IepGoal), useValue: mockGoalRepo },
        { provide: getRepositoryToken(RiskEvent), useValue: mockRiskRepo },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAnalytics', () => {
    it('should return analytics with zero counts when no data', async () => {
      mockStudentRepo.count.mockResolvedValue(0);
      mockStudentRepo.find.mockResolvedValue([]);
      mockAttendanceRepo.find.mockResolvedValue([]);
      mockAttendanceRepo.query.mockResolvedValue([]);
      mockPlanRepo.createQueryBuilder.mockReturnValue({ where: jest.fn().mockReturnThis(), getCount: jest.fn().mockResolvedValue(0) });
      mockPlanRepo.find.mockResolvedValue([]);
      mockRiskRepo.count.mockResolvedValue(0);

      const result = await service.getAnalytics();

      expect(result.students.total).toBe(0);
      expect(result.students.byDisabilityType).toEqual([]);
      expect(result.attendance.today.total).toBe(0);
      expect(result.attendance.trend).toHaveLength(7);
      expect(result.flaggedStudents).toBe(0);
      expect(result.iep.activePlans).toBe(0);
      expect(result.iep.goalsTotal).toBe(0);
      expect(result.iep.weeklyAchievementPercent).toBe(0);
    });

    it('should return student distribution by disability type', async () => {
      const mockStudents = [
        { id: 1, disabilityType: 'صعوبات تعلم', status: 'active', rtiTier: 1 },
        { id: 2, disabilityType: 'اضطراب طيف التوحد', status: 'active', rtiTier: 2 },
        { id: 3, disabilityType: 'صعوبات تعلم', status: 'inactive', rtiTier: 1 },
      ];
      mockStudentRepo.count.mockResolvedValue(3);
      mockStudentRepo.find.mockResolvedValue(mockStudents as any[]);
      mockAttendanceRepo.find.mockResolvedValue([]);
      mockAttendanceRepo.query.mockResolvedValue([]);
      mockPlanRepo.createQueryBuilder.mockReturnValue({ where: jest.fn().mockReturnThis(), getCount: jest.fn().mockResolvedValue(1) });
      mockPlanRepo.find.mockResolvedValue([{ id: 10 }]);
      mockGoalRepo.find.mockResolvedValue([{ id: 1, status: 'done' }, { id: 2, status: 'in_progress' }] as any[]);
      mockRiskRepo.count.mockResolvedValue(1);

      const result = await service.getAnalytics();

      expect(result.students.total).toBe(3);
      const dtMap = new Map(result.students.byDisabilityType.map((d) => [d.label, d.count]));
      expect(dtMap.get('صعوبات تعلم')).toBe(2);
      expect(dtMap.get('اضطراب طيف التوحد')).toBe(1);
      expect(result.flaggedStudents).toBe(1);
      expect(result.iep.goalsTotal).toBe(2);
      expect(result.iep.objectivesCompleted).toBe(1);
    });

    it('should handle attendance data correctly', async () => {
      mockStudentRepo.count.mockResolvedValue(1);
      mockStudentRepo.find.mockResolvedValue([{ id: 1, disabilityType: 'أخرى', status: 'active', rtiTier: 2 }] as any[]);
      mockAttendanceRepo.find.mockResolvedValue([
        { status: 'present' }, { status: 'present' }, { status: 'absent' }, { status: 'late' },
      ] as any[]);
      mockAttendanceRepo.query.mockResolvedValue([
        { date: new Date().toLocaleDateString('en-CA'), status: 'present', count: 2 },
        { date: new Date().toLocaleDateString('en-CA'), status: 'absent', count: 1 },
      ]);
      mockPlanRepo.createQueryBuilder.mockReturnValue({ where: jest.fn().mockReturnThis(), getCount: jest.fn().mockResolvedValue(0) });
      mockPlanRepo.find.mockResolvedValue([]);
      mockRiskRepo.count.mockResolvedValue(0);

      const result = await service.getAnalytics();

      expect(result.attendance.today.total).toBe(4);
      expect(result.attendance.today.present).toBe(2);
      expect(result.attendance.today.absent).toBe(1);
      expect(result.attendance.today.late).toBe(1);
    });
  });
});
