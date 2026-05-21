import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Student } from '../students/student.entity';
import { IepPlan } from '../iep/entities/iep-plan.entity';
import { IepGoal } from '../iep/entities/iep-goal.entity';
import { RtiAssessment } from '../rti/entities/rti-assessment.entity';
import { FbaRecord } from '../fba/entities/fba.entity';
import { AbcRecord } from '../abc/entities/abc-record.entity';
import { Attendance } from '../attendance/attendance.entity';
import { NotFoundException } from '@nestjs/common';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockStudentRepo = {
    count: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
  };

  const mockPlanRepo = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };

  const mockGoalRepo = {
    find: jest.fn(),
    query: jest.fn(),
  };

  const mockRtiRepo = { find: jest.fn() };
  const mockFbaRepo = { find: jest.fn(), findOneBy: jest.fn() as jest.Mock }; 
  const mockAbcRepo = { find: jest.fn() };
  const mockAttendanceRepo = { find: jest.fn(), createQueryBuilder: jest.fn() };
  const mockLogger = { info: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: getRepositoryToken(IepPlan), useValue: mockPlanRepo },
        { provide: getRepositoryToken(IepGoal), useValue: mockGoalRepo },
        { provide: getRepositoryToken(RtiAssessment), useValue: mockRtiRepo },
        { provide: getRepositoryToken(FbaRecord), useValue: mockFbaRepo },
        { provide: getRepositoryToken(AbcRecord), useValue: mockAbcRepo },
        { provide: getRepositoryToken(Attendance), useValue: mockAttendanceRepo },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should return summary stats', async () => {
      mockStudentRepo.count.mockResolvedValue(10);

      const qb = { where: jest.fn().mockReturnThis(), getCount: jest.fn().mockResolvedValue(5) };
      mockPlanRepo.createQueryBuilder.mockReturnValue(qb);

      mockGoalRepo.find.mockResolvedValue([
        { status: 'done' },
        { status: 'completed' },
        { status: 'in_progress' },
      ]);
      mockGoalRepo.query.mockResolvedValue([]);

      const result = await service.getSummary();

      expect(result.students).toBe(10);
      expect(result.activeIepPlans).toBe(5);
      expect(result.objectivesCompleted).toBe(2);
      expect(result.goalsTotal).toBe(3);
      expect(result.weeklyAchievementPercent).toBe(67);
      expect(result.weeklyProgress).toHaveLength(7);
    });
  });

  describe('generateIepPdf', () => {
    it('should generate PDF buffer', async () => {
      const student = { id: 1, fullName: 'طالب', disabilityType: 'صعوبات', diagnosis: 'عسر القراءة' };
      mockStudentRepo.findOne.mockResolvedValue(student);
      mockPlanRepo.find.mockResolvedValue([{
        id: 1,
        status: 'active',
        startDate: '2026-01-01',
        endDate: null,
        goals: [{ title: 'هدف 1', currentPercentage: 50, status: 'in_progress' }],
      }]);

      const buffer = await service.generateIepPdf(1);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should throw when student not found', async () => {
      mockStudentRepo.findOne.mockResolvedValue(null);
      await expect(service.generateIepPdf(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateRtiReport', () => {
    it('should generate RTI PDF', async () => {
      mockStudentRepo.findOne.mockResolvedValue({ id: 1, fullName: 'طالب', rtiTier: 2 });
      mockRtiRepo.find.mockResolvedValue([{ previousTier: 1, newTier: 2, createdAt: new Date(), reason: 'test' }]);
      const buffer = await service.generateRtiReport(1);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateFbaReport', () => {
    it('should generate FBA PDF', async () => {
      mockFbaRepo.findOneBy = jest.fn().mockResolvedValue({
        id: 1, studentId: 1, targetBehavior: 'Aggression',
        antecedents: [], behaviors: [], consequences: [],
        bip: { replacementBehavior: 'Ask', interventionStrategies: [], reinforcementPlan: '' },
      });
      mockStudentRepo.findOne.mockResolvedValue({ fullName: 'طالب' });
      const buffer = await service.generateFbaReport(1);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should throw when FBA not found', async () => {
      mockFbaRepo.findOneBy = jest.fn().mockResolvedValue(null);
      await expect(service.generateFbaReport(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateComprehensiveReport', () => {
    it('should generate comprehensive PDF', async () => {
      mockStudentRepo.findOne.mockResolvedValue({ id: 1, fullName: 'طالب', rtiTier: 2, riskScore: 10 });
      mockPlanRepo.find.mockResolvedValue([]);
      mockRtiRepo.find.mockResolvedValue([]);
      mockFbaRepo.find.mockResolvedValue([]);
      mockAbcRepo.find.mockResolvedValue([]);
      const buffer = await service.generateComprehensiveReport(1);
      expect(buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generateAttendanceCsv', () => {
    it('should generate CSV string', async () => {
      const student = { id: 1, fullName: 'طالب اختبار' };
      mockStudentRepo.findOne.mockResolvedValue(student);

      const csv = await service.generateAttendanceCsv(1);
      expect(csv).toContain('student_id,student_name,date,status');
      expect(csv).toContain('1,"طالب اختبار"');
      expect(csv).toContain(',present');
    });

    it('should throw when student not found', async () => {
      mockStudentRepo.findOne.mockResolvedValue(null);
      await expect(service.generateAttendanceCsv(999)).rejects.toThrow(NotFoundException);
    });
  });
});
