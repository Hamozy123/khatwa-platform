import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getLocations: jest.fn(),
    changePassword: jest.fn(),
    listUsers: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  const mockRequest = (userId = 1) => ({ user: { userId, username: 'admin', role: 'admin' } } as any);
  const mockResponse = () => ({ cookie: jest.fn(), clearCookie: jest.fn() } as any);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const dto = { username: 'admin', password: 'password' };
      mockAuthService.login.mockResolvedValue({ access_token: 'token', refresh_token: 'rt', user: {} });
      const res = mockResponse();
      const result = await controller.login(dto, res);
      expect(result.access_token).toBe('token');
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(res.cookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockAuthService.getProfile.mockResolvedValue({ id: 1, username: 'admin' });
      const result = await controller.getProfile(mockRequest());
      expect(result).toEqual({ id: 1, username: 'admin' });
      expect(mockAuthService.getProfile).toHaveBeenCalledWith(1);
    });
  });

  describe('updateProfile', () => {
    it('should update and return message', async () => {
      mockAuthService.updateProfile.mockResolvedValue({ access_token: 'new_token', user: { id: 1, governorate: 'الجيزة' } });
      const dto = { governorate: 'الجيزة' };
      const result = await controller.updateProfile(dto, mockRequest());
      expect(result.access_token).toBe('new_token');
      expect(result.user.governorate).toBe('الجيزة');
    });
  });

  describe('getLocations', () => {
    it('should return locations', async () => {
      mockAuthService.getLocations.mockResolvedValue(['القاهرة', 'الجيزة']);
      const result = await controller.getLocations('governorate');
      expect(result).toEqual(['القاهرة', 'الجيزة']);
    });
  });

  describe('changePassword', () => {
    it('should change password', async () => {
      mockAuthService.changePassword.mockResolvedValue({ message: 'تم تغيير كلمة المرور بنجاح' });
      const result = await controller.changePassword({ oldPassword: 'old', newPassword: 'new' }, mockRequest());
      expect(result.message).toBe('تم تغيير كلمة المرور بنجاح');
    });
  });

  describe('listUsers', () => {
    it('should list all users', async () => {
      mockAuthService.listUsers.mockResolvedValue([{ id: 1, username: 'admin' }]);
      const result = await controller.listUsers(mockRequest());
      expect(result).toHaveLength(1);
      expect(mockAuthService.listUsers).toHaveBeenCalledWith(mockRequest().user);
    });
  });

  describe('getUser', () => {
    it('should get user by id', async () => {
      mockAuthService.getProfile.mockResolvedValue({ id: 1, username: 'admin' });
      const result = await controller.getUser(1);
      expect(mockAuthService.getProfile).toHaveBeenCalledWith(1);
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      mockAuthService.createUser.mockResolvedValue({ id: 2, username: 'newuser' });
      const result = await controller.createUser({ username: 'newuser' });
      expect(result.username).toBe('newuser');
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      mockAuthService.updateUser.mockResolvedValue({ message: 'تم تحديث المستخدم بنجاح' });
      const result = await controller.updateUser(1, { role: 'teacher_m' });
      expect(mockAuthService.updateUser).toHaveBeenCalledWith(1, { role: 'teacher_m' });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      mockAuthService.deleteUser.mockResolvedValue({ message: 'تم حذف المستخدم بنجاح' });
      const result = await controller.deleteUser(1);
      expect(mockAuthService.deleteUser).toHaveBeenCalledWith(1);
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      mockAuthService.updateUser.mockResolvedValue({ message: 'تم تحديث المستخدم بنجاح' });
      const result = await controller.resetPassword(1, { password: 'newpass123' });
      expect(mockAuthService.updateUser).toHaveBeenCalledWith(1, { password: 'newpass123' });
    });
  });
});
