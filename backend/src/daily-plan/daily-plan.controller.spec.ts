import { Test, TestingModule } from '@nestjs/testing';
import { DailyPlanController } from './daily-plan.controller';
import { DailyPlanService } from './daily-plan.service';

describe('DailyPlanController', () => {
  let controller: DailyPlanController;
  let service: DailyPlanService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailyPlanController],
      providers: [{ provide: DailyPlanService, useValue: mockService }],
    }).compile();

    controller = module.get<DailyPlanController>(DailyPlanController);
    service = module.get<DailyPlanService>(DailyPlanService);
    jest.clearAllMocks();
  });

  it('findAll', async () => {
    mockService.findAll.mockResolvedValue([]);
    await controller.findAll('2026-05-13', '1');
    expect(mockService.findAll).toHaveBeenCalledWith('2026-05-13', 1);
  });

  it('findOne', async () => {
    mockService.findOne.mockResolvedValue({ id: 1 });
    await controller.findOne(1);
    expect(mockService.findOne).toHaveBeenCalledWith(1);
  });

  it('create', async () => {
    const dto = { studentId: 1, title: 'test', date: '2026-05-13' } as any;
    mockService.create.mockResolvedValue({ id: 1 });
    await controller.create(dto);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('update', async () => {
    const dto = { status: 'done' } as any;
    mockService.update.mockResolvedValue({ id: 1 });
    await controller.update(1, dto);
    expect(mockService.update).toHaveBeenCalledWith(1, dto);
  });

  it('remove', async () => {
    mockService.remove.mockResolvedValue({ id: 1 });
    await controller.remove(1);
    expect(mockService.remove).toHaveBeenCalledWith(1);
  });
});
