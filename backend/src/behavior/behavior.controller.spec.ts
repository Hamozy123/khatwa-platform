import { Test, TestingModule } from '@nestjs/testing';
import { BehaviorController } from './behavior.controller';
import { BehaviorService } from './behavior.service';

describe('BehaviorController', () => {
  let controller: BehaviorController;
  let service: BehaviorService;

  const mockService = {
    create: jest.fn(),
    findByStudent: jest.fn(),
    getTrend: jest.fn(),
    remove: jest.fn(),
  };

  const mockReq = { user: { userId: 1 } } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BehaviorController],
      providers: [{ provide: BehaviorService, useValue: mockService }],
    }).compile();

    controller = module.get<BehaviorController>(BehaviorController);
    service = module.get<BehaviorService>(BehaviorService);
    jest.clearAllMocks();
  });

  it('create', async () => {
    const dto = { studentId: 1, date: '2026-05-01', indicators: { attention: 8 } } as any;
    mockService.create.mockResolvedValue({ id: 1 });
    await controller.create(dto, mockReq);
    expect(mockService.create).toHaveBeenCalledWith(dto, 1);
  });

  it('findByStudent', async () => {
    mockService.findByStudent.mockResolvedValue([]);
    await controller.findByStudent(1);
    expect(mockService.findByStudent).toHaveBeenCalledWith(1);
  });

  it('getTrend', async () => {
    mockService.getTrend.mockResolvedValue([]);
    await controller.getTrend(1, 'attention');
    expect(mockService.getTrend).toHaveBeenCalledWith(1, 'attention');
  });

  it('remove', async () => {
    mockService.remove.mockResolvedValue(undefined);
    await controller.remove(1);
    expect(mockService.remove).toHaveBeenCalledWith(1);
  });
});
