import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from './locations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Location } from './location.entity';

describe('LocationsService', () => {
  let service: LocationsService;

  const mockRepo = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockLogger = { info: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: getRepositoryToken(Location), useValue: mockRepo },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  describe('onModuleInit', () => {
    it('should seed locations when DB empty', async () => {
      mockRepo.count.mockResolvedValue(0);
      mockRepo.create.mockImplementation((e) => e);
      mockRepo.save.mockResolvedValue({});

      await service.onModuleInit();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('seeded'),
      );
    });

    it('should not seed when locations exist', async () => {
      mockRepo.count.mockResolvedValue(10);
      await service.onModuleInit();
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return locations filtered by type', async () => {
      mockRepo.find.mockResolvedValue([{ id: 1, type: 'governorate', name: 'القاهرة' }]);
      const result = await service.findAll('governorate');
      expect(result).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { type: 'governorate' },
        order: { name: 'ASC' },
      });
    });

    it('should return locations filtered by parentId', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.findAll('directorate', 1);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { type: 'directorate', parentId: 1 },
        order: { name: 'ASC' },
      });
    });
  });
});
