import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

describe('StudentsController', () => {
  let controller: StudentsController;
  let service: StudentsService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockDataSource = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        { provide: StudentsService, useValue: mockService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
    service = module.get<StudentsService>(StudentsService);
    jest.clearAllMocks();
  });

  const mockReq = { user: { role: 'admin' } } as any;

  describe('findAll', () => {
    it('should call service with query params', async () => {
      mockService.findAll.mockResolvedValue({ data: [], total: 0, skip: 0, take: 20 });
      await controller.findAll(mockReq, 'طالب', '0', '20');
      expect(mockService.findAll).toHaveBeenCalledWith({ search: 'طالب', skip: 0, take: 20, user: mockReq.user });
    });
  });

  describe('findOne', () => {
    it('should return a student', async () => {
      mockService.findOne.mockResolvedValue({ id: 1, fullName: 'test' });
      const result = await controller.findOne(1, mockReq);
      expect(mockService.findOne).toHaveBeenCalledWith(1, mockReq.user);
      expect(result!.fullName).toBe('test');
    });
  });

  describe('create', () => {
    it('should create a student', async () => {
      const dto = { fullName: 'new student' } as any;
      mockService.create.mockResolvedValue({ id: 2, fullName: 'new student' });
      const result = await controller.create(dto);
      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe(2);
    });
  });

  describe('update', () => {
    it('should update a student', async () => {
      const dto = { fullName: 'updated' } as any;
      mockService.update.mockResolvedValue({ id: 1, fullName: 'updated' });
      await controller.update(1, dto);
      expect(mockService.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('should delete a student', async () => {
      mockService.remove.mockResolvedValue(undefined);
      await controller.remove(1);
      expect(mockService.remove).toHaveBeenCalledWith(1);
    });
  });
});
