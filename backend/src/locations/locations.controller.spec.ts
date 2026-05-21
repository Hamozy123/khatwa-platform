import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

describe('LocationsController', () => {
  let controller: LocationsController;
  let service: LocationsService;

  const mockService = { findAll: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [{ provide: LocationsService, useValue: mockService }],
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
    service = module.get<LocationsService>(LocationsService);
    jest.clearAllMocks();
  });

  it('findAll', async () => {
    mockService.findAll.mockResolvedValue([]);
    await controller.findAll('governorate', '1');
    expect(mockService.findAll).toHaveBeenCalledWith('governorate', 1);
  });
});
