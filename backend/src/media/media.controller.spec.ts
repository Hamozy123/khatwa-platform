import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

describe('MediaController', () => {
  let controller: MediaController;
  let service: MediaService;

  const mockService = {
    upload: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getFilePath: jest.fn(),
    remove: jest.fn(),
  };

  const mockReq = { user: { userId: 1 } } as any;
  const mockFile = { originalname: 'test.pdf', mimetype: 'application/pdf', size: 1024 } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [{ provide: MediaService, useValue: mockService }],
    }).compile();

    controller = module.get<MediaController>(MediaController);
    service = module.get<MediaService>(MediaService);
    jest.clearAllMocks();
  });

  it('upload', async () => {
    const dto = { tags: 'test' } as any;
    mockService.upload.mockResolvedValue({ id: 1 });
    await controller.upload(mockFile, dto, mockReq);
    expect(mockService.upload).toHaveBeenCalledWith(mockFile, {
      tags: 'test',
      studentId: undefined,
      uploadedBy: 1,
    });
  });

  it('findAll', async () => {
    mockService.findAll.mockResolvedValue([]);
    await controller.findAll('test', '1');
    expect(mockService.findAll).toHaveBeenCalledWith('test', 1);
  });

  it('findOne', async () => {
    mockService.findOne.mockResolvedValue({ id: 1 });
    await controller.findOne(1);
    expect(mockService.findOne).toHaveBeenCalledWith(1);
  });

  it('getFile', async () => {
    const mockRes = { res: { sendFile: jest.fn() } };
    mockService.getFilePath.mockResolvedValue({ storagePath: '/path/file.pdf' });
    await controller.getFile(1, mockRes);
    expect(mockService.getFilePath).toHaveBeenCalledWith(1);
    expect(mockRes.res.sendFile).toHaveBeenCalledWith('/path/file.pdf');
  });

  it('remove', async () => {
    mockService.remove.mockResolvedValue(undefined);
    await controller.remove(1);
    expect(mockService.remove).toHaveBeenCalledWith(1);
  });
});
