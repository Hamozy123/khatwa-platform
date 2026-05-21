import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockService = {
    getSummary: jest.fn(),
    generateIepPdf: jest.fn(),
    generateAttendanceCsv: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockService }],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  it('getSummary', async () => {
    mockService.getSummary.mockResolvedValue({ students: 10 });
    const req = { user: { role: 'admin' } } as any;
    const result = await controller.getSummary(req);
    expect(result.students).toBe(10);
  });

  it('getIepPdf', async () => {
    const buffer = Buffer.from('pdf content');
    mockService.generateIepPdf.mockResolvedValue(buffer);
    const res = {
      set: jest.fn(),
      end: jest.fn(),
    } as any;

    await controller.getIepPdf(1, res);
    expect(mockService.generateIepPdf).toHaveBeenCalledWith(1);
    expect(res.set).toHaveBeenCalledWith(expect.objectContaining({
      'Content-Type': 'application/pdf',
    }));
    expect(res.end).toHaveBeenCalledWith(buffer);
  });

  it('getAttendanceCsv', async () => {
    mockService.generateAttendanceCsv.mockResolvedValue('csv content');
    const res = {
      set: jest.fn(),
      end: jest.fn(),
    } as any;

    await controller.getAttendanceCsv(1, res);
    expect(mockService.generateAttendanceCsv).toHaveBeenCalledWith(1);
    expect(res.set).toHaveBeenCalledWith(expect.objectContaining({
      'Content-Type': 'text/csv; charset=utf-8',
    }));
    expect(res.end).toHaveBeenCalledWith('csv content');
  });
});
