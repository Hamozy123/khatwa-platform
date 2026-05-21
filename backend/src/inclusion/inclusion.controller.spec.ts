import { Test, TestingModule } from '@nestjs/testing';
import { InclusionController } from './inclusion.controller';
import { InclusionService } from './inclusion.service';

describe('InclusionController', () => {
  let controller: InclusionController;
  let service: InclusionService;

  const mockService = {
    create: jest.fn(),
    findByStudent: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockReq = { user: { userId: 1 } } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InclusionController],
      providers: [{ provide: InclusionService, useValue: mockService }],
    }).compile();

    controller = module.get<InclusionController>(InclusionController);
    service = module.get<InclusionService>(InclusionService);
    jest.clearAllMocks();
  });

  it('create', async () => {
    const dto = { studentId: 1, accommodationType: 'audio', description: 'test' } as any;
    mockService.create.mockResolvedValue({ id: 1 });
    await controller.create(dto, mockReq);
    expect(mockService.create).toHaveBeenCalledWith(dto, 1);
  });

  it('findByStudent', async () => {
    mockService.findByStudent.mockResolvedValue([]);
    await controller.findByStudent(1);
    expect(mockService.findByStudent).toHaveBeenCalledWith(1);
  });

  it('update', async () => {
    const dto = { description: 'updated' } as any;
    mockService.update.mockResolvedValue({ id: 1 });
    await controller.update(1, dto);
    expect(mockService.update).toHaveBeenCalledWith(1, dto);
  });

  it('remove', async () => {
    mockService.remove.mockResolvedValue(undefined);
    await controller.remove(1);
    expect(mockService.remove).toHaveBeenCalledWith(1);
  });
});
