import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { User } from './user.entity';
import { RefreshToken } from './refresh-token.entity';
import { UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser: User = {
    id: 1,
    username: 'admin',
    password: 'hashed_password',
    role: 'admin',
    governorate: 'القاهرة',
    directorate: 'مديرية القاهرة الجديدة',
    administration: 'إدارة التجمع الأول',
    schoolName: 'مدرسة التجمع الأول الابتدائية',
    loginAttempts: 0,
    lockedUntil: null as any,
  };

  let mockRepo: any;
  let mockRefreshRepo: any;
  let mockJwtService: any;
  let mockLogger: any;

  beforeEach(async () => {
    mockRepo = {
      count: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn().mockReturnValue(mockUser),
      createQueryBuilder: jest.fn(),
    };

    mockRefreshRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockResolvedValue({ id: 1, token: 'rt', userId: 1 }),
      delete: jest.fn(),
      update: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('test_token'),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('onModuleInit', () => {
    it('should seed admin user when DB is empty', async () => {
      mockRepo.count.mockResolvedValue(0);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      await service.onModuleInit();

      expect(mockRepo.count).toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('default admin user created');
    });

    it('should not seed when users exist', async () => {
      mockRepo.count.mockResolvedValue(1);
      await service.onModuleInit();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user on valid credentials', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('admin', 'password');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.validateUser('nonexistent', 'password');
      expect(result).toBeNull();
    });

    it('should return null on wrong password', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('admin', 'wrong');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return token and user on success', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);

      const result = await service.login({ username: 'admin', password: 'password' });

      expect(result.access_token).toBe('test_token');
      expect(result.refresh_token).toBeTruthy();
      expect(result.user.id).toBe(1);
      expect(result.user.username).toBe('admin');
    });

    it('should throw on invalid credentials', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);
      await expect(service.login({ username: 'admin', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      const result = await service.getProfile(1);
      expect(result.id).toBe(1);
      expect(result.username).toBe('admin');
    });

    it('should throw when user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockUser });
      mockRepo.save.mockResolvedValue({ ...mockUser, governorate: 'الجيزة' });

      const result = await service.updateProfile(1, { governorate: 'الجيزة' });
      expect(result.access_token).toBe('test_token');
      expect(result.user.governorate).toBe('الجيزة');
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should throw when user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.updateProfile(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLocations', () => {
    it('should return distinct locations', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ governorate: 'القاهرة' }, { governorate: 'الجيزة' }]),
      };
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getLocations('governorate');
      expect(result).toEqual(['القاهرة', 'الجيزة']);
    });

    it('should filter by parent field', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ directorate: 'مديرية القاهرة' }]),
      };
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getLocations('directorate', 'governorate', 'القاهرة');
      expect(result).toEqual(['مديرية القاهرة']);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed');

      const result = await service.changePassword(1, { oldPassword: 'password', newPassword: 'newpass123' });
      expect(result.message).toBe('تم تغيير كلمة المرور بنجاح');
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should throw on wrong old password', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(1, { oldPassword: 'wrong', newPassword: 'newpass' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.changePassword(999, { oldPassword: 'pass', newPassword: 'new' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('listUsers', () => {
    it('should return all users for admin', async () => {
      mockRepo.find.mockResolvedValue([mockUser]);
      const result = await service.listUsers({ role: 'admin' });
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('admin');
      expect(mockRepo.find).toHaveBeenCalledWith({ where: {}, select: expect.any(Array), order: { id: 'ASC' } });
    });

    it('should filter by school for teacher', async () => {
      mockRepo.find.mockResolvedValue([mockUser]);
      await service.listUsers({ role: 'teacher_m', schoolName: 'مدرسة التجمع الأول الابتدائية' });
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { schoolName: 'مدرسة التجمع الأول الابتدائية' }, select: expect.any(Array), order: { id: 'ASC' } });
    });

    it('should filter by directorate for deputy', async () => {
      mockRepo.find.mockResolvedValue([mockUser]);
      await service.listUsers({ role: 'deputy_directorate', directorate: 'مديرية القاهرة' });
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { directorate: 'مديرية القاهرة' }, select: expect.any(Array), order: { id: 'ASC' } });
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue({ ...mockUser, id: 2, username: 'newuser' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const result = await service.createUser({ username: 'newuser' });
      expect(result.username).toBe('newuser');
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should throw on duplicate username', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      await expect(service.createUser({ username: 'admin' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      mockRepo.save.mockResolvedValue({ ...mockUser, role: 'teacher_m' });

      const result = await service.updateUser(1, { role: 'teacher_m' });
      expect(result.message).toBe('تم تحديث المستخدم بنجاح');
    });

    it('should throw when user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.updateUser(999, {})).rejects.toThrow(NotFoundException);
    });

    it('should throw on duplicate username', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockUser).mockResolvedValueOnce({ id: 2, username: 'existing' });
      await expect(service.updateUser(1, { username: 'existing' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUser', () => {
    it('should delete a non-admin user', async () => {
      const nonAdmin = { ...mockUser, role: 'teacher_m' };
      mockRepo.findOne.mockResolvedValue(nonAdmin);
      mockRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteUser(2);
      expect(result.message).toBe('تم حذف المستخدم بنجاح');
    });

    it('should throw when user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteUser(999)).rejects.toThrow(NotFoundException);
    });

    it('should prevent deleting last admin', async () => {
      const adminUser = { id: 1, username: 'admin', password: 'hash', role: 'admin', governorate: '', directorate: '', administration: '', schoolName: '' };
      mockRepo.findOne.mockResolvedValue(adminUser);
      mockRepo.count.mockResolvedValue(1);
      mockRepo.delete.mockResolvedValue({ affected: 1 });

      await expect(service.deleteUser(1)).rejects.toThrow(BadRequestException);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });
});
