import { Test, TestingModule } from '@nestjs/testing';
import { IepController } from './iep.controller';
import { IepService } from './iep.service';

describe('IepController', () => {
  let controller: IepController;
  let service: IepService;

  const mockService = {
    findPlansByStudent: jest.fn(),
    findPlans: jest.fn(),
    createPlan: jest.fn(),
    createGoal: jest.fn(),
    updateGoal: jest.fn(),
    removeGoal: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IepController],
      providers: [{ provide: IepService, useValue: mockService }],
    }).compile();

    controller = module.get<IepController>(IepController);
    service = module.get<IepService>(IepService);
    jest.clearAllMocks();
  });

  it('findPlansByStudent', async () => {
    mockService.findPlansByStudent.mockResolvedValue([]);
    await controller.findPlansByStudent(1);
    expect(mockService.findPlansByStudent).toHaveBeenCalledWith(1);
  });

  it('findPlans', async () => {
    mockService.findPlans.mockResolvedValue([]);
    await controller.findPlans();
    expect(mockService.findPlans).toHaveBeenCalled();
  });

  it('createPlan', async () => {
    const dto = { studentId: 1 } as any;
    mockService.createPlan.mockResolvedValue({ id: 1 });
    await controller.createPlan(dto);
    expect(mockService.createPlan).toHaveBeenCalledWith(dto);
  });

  it('createGoal', async () => {
    const dto = { planId: 1, title: 'goal' } as any;
    mockService.createGoal.mockResolvedValue({ id: 1 });
    await controller.createGoal(dto);
    expect(mockService.createGoal).toHaveBeenCalledWith(dto);
  });

  it('updateGoal', async () => {
    const dto = { currentPercentage: 100 } as any;
    mockService.updateGoal.mockResolvedValue({ id: 1 });
    await controller.updateGoal(1, dto);
    expect(mockService.updateGoal).toHaveBeenCalledWith(1, dto);
  });

  it('removeGoal', async () => {
    mockService.removeGoal.mockResolvedValue(undefined);
    await controller.removeGoal(1);
    expect(mockService.removeGoal).toHaveBeenCalledWith(1);
  });
});
