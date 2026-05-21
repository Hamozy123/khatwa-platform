import { Injectable, OnModuleInit, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as bcrypt from 'bcrypt';
import { Repository, LessThan } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from './user.entity';
import { RefreshToken } from './refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { buildUserScopeFilter } from '../core/scope.utils';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async onModuleInit() {
    const count = await this.userRepository.count();
    if (count === 0) {
      const passwordHash = await bcrypt.hash('password', 10);
      await this.userRepository.save(
        this.userRepository.create({
          username: 'admin',
          password: passwordHash,
          role: 'admin',
          governorate: 'القاهرة',
          directorate: 'مديرية القاهرة الجديدة',
          administration: 'إدارة التجمع الأول',
          schoolName: 'مدرسة التجمع الأول الابتدائية',
        }),
      );
      this.logger.info('default admin user created');
    }
  }

  private async checkLockout(user: User) {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`الحساب مقفل. حاول بعد ${remaining} دقيقة`);
    }
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      user.loginAttempts = 0;
      user.lockedUntil = null as any;
      await this.userRepository.save(user);
    }
  }

  private async recordFailedAttempt(user: User) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS) as any;
      this.logger.warn('account locked due to failed attempts', { userId: user.id, attempts: user.loginAttempts });
    }
    await this.userRepository.save(user);
  }

  private async createRefreshToken(userId: number): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 3600 * 1000);
    await this.refreshTokenRepository.save({ userId, token, expiresAt, revoked: false, rotationCount: 0 });
    return token;
  }

  async refreshTokens(oldRefreshToken: string) {
    const stored = await this.refreshTokenRepository.findOne({ where: { token: oldRefreshToken } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('رمز التحديث غير صالح أو منتهي الصلاحية');
    }
    stored.revoked = true;
    stored.rotationCount += 1;
    await this.refreshTokenRepository.save(stored);

    const user = await this.userRepository.findOne({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('المستخدم غير موجود');

    const payload = { username: user.username, sub: user.id, role: user.role, governorate: user.governorate, directorate: user.directorate, administration: user.administration, schoolName: user.schoolName };
    const newRefreshToken = await this.createRefreshToken(user.id);
    this.logger.info('tokens refreshed', { userId: user.id });
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRY }),
      refresh_token: newRefreshToken,
      user: { id: user.id, username: user.username, role: user.role, governorate: user.governorate, directorate: user.directorate, administration: user.administration, schoolName: user.schoolName },
    };
  }

  async revokeUserRefreshTokens(userId: number) {
    await this.refreshTokenRepository.update({ userId, revoked: false }, { revoked: true });
    this.logger.info('all refresh tokens revoked', { userId });
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) return null;
    await this.checkLockout(user);
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await this.recordFailedAttempt(user);
      return null;
    }
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockedUntil = null as any;
      await this.userRepository.save(user);
    }
    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }
    const payload = { username: user.username, sub: user.id, role: user.role, governorate: user.governorate, directorate: user.directorate, administration: user.administration, schoolName: user.schoolName };
    const refreshToken = await this.createRefreshToken(user.id);
    this.logger.info('user logged in', { userId: user.id });
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRY }),
      refresh_token: refreshToken,
      user: { id: user.id, username: user.username, role: user.role, governorate: user.governorate, directorate: user.directorate, administration: user.administration, schoolName: user.schoolName },
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return { id: user.id, username: user.username, role: user.role, governorate: user.governorate, directorate: user.directorate, administration: user.administration, schoolName: user.schoolName };
  }

  async updateProfile(userId: number, dto: Partial<Pick<User, 'governorate' | 'directorate' | 'administration' | 'schoolName' | 'role'>>) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    if (dto.governorate !== undefined) user.governorate = dto.governorate;
    if (dto.directorate !== undefined) user.directorate = dto.directorate;
    if (dto.administration !== undefined) user.administration = dto.administration;
    if (dto.schoolName !== undefined) user.schoolName = dto.schoolName;
    if (dto.role !== undefined) user.role = dto.role;
    await this.userRepository.save(user);
    this.logger.info('profile updated', { userId });
    const payload = { username: user.username, sub: user.id, role: user.role, governorate: user.governorate, directorate: user.directorate, administration: user.administration, schoolName: user.schoolName };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRY }),
      user: { id: user.id, username: user.username, role: user.role, governorate: user.governorate, directorate: user.directorate, administration: user.administration, schoolName: user.schoolName },
    };
  }

  async getLocations(field: 'governorate' | 'directorate' | 'administration' | 'schoolName', parentField?: string, parentValue?: string) {
    const qb = this.userRepository.createQueryBuilder('u').select(`u.${field}`, field).where(`u.${field} IS NOT NULL`);
    if (parentField && parentValue) {
      qb.andWhere(`u.${parentField} = :parentValue`, { parentValue });
    }
    const rows = await qb.distinct(true).orderBy(`u.${field}`, 'ASC').getRawMany();
    return rows.map((r) => r[field]);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('المستخدم غير موجود');
    const match = await bcrypt.compare(dto.oldPassword, user.password);
    if (!match) throw new UnauthorizedException('كلمة المرور القديمة غير صحيحة');
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);
    await this.revokeUserRefreshTokens(userId);
    this.logger.info('password changed', { userId });
    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  async listUsers(user?: any) {
    const where = buildUserScopeFilter(user);
    const users = await this.userRepository.find({
      where,
      select: ['id', 'username', 'role', 'governorate', 'directorate', 'administration', 'schoolName'],
      order: { id: 'ASC' },
    });
    return users;
  }

  async createUser(dto: CreateUserDto) {
    const existing = await this.userRepository.findOne({ where: { username: dto.username } });
    if (existing) throw new BadRequestException('اسم المستخدم موجود مسبقاً');
    const password = dto.password || 'Khatwa@123';
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User();
    user.username = dto.username;
    user.password = passwordHash;
    user.role = dto.role || 'teacher_m';
    if (dto.governorate) user.governorate = dto.governorate;
    if (dto.directorate) user.directorate = dto.directorate;
    if (dto.administration) user.administration = dto.administration;
    if (dto.schoolName) user.schoolName = dto.schoolName;
    const saved = await this.userRepository.save(user);
    this.logger.info('user created', { username: dto.username, role: saved.role });
    return { id: saved.id, username: saved.username, role: saved.role, governorate: saved.governorate, directorate: saved.directorate, administration: saved.administration, schoolName: saved.schoolName };
  }

  async updateUser(id: number, dto: Partial<CreateUserDto>) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    if (dto.username !== undefined) {
      const existing = await this.userRepository.findOne({ where: { username: dto.username } });
      if (existing && existing.id !== id) throw new BadRequestException('اسم المستخدم موجود مسبقاً');
      user.username = dto.username;
    }
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.governorate !== undefined) user.governorate = dto.governorate;
    if (dto.directorate !== undefined) user.directorate = dto.directorate;
    if (dto.administration !== undefined) user.administration = dto.administration;
    if (dto.schoolName !== undefined) user.schoolName = dto.schoolName;
    await this.userRepository.save(user);
    this.logger.info('user updated', { userId: id });
    return { message: 'تم تحديث المستخدم بنجاح' };
  }

  async deleteUser(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    if (user.role === 'admin') {
      const adminCount = await this.userRepository.count({ where: { role: 'admin' } });
      if (adminCount <= 1) throw new BadRequestException('لا يمكن حذف آخر مشرف في النظام');
    }
    await this.refreshTokenRepository.delete({ userId: id });
    await this.userRepository.delete(id);
    this.logger.info('user deleted', { userId: id, username: user.username });
    return { message: 'تم حذف المستخدم بنجاح' };
  }

  async cleanupExpiredRefreshTokens() {
    const deleted = await this.refreshTokenRepository.delete({ expiresAt: LessThan(new Date()) });
    if (deleted.affected) this.logger.info('expired refresh tokens cleaned', { count: deleted.affected });
  }
}
