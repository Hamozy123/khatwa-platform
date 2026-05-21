import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, Res } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../core/public.decorator';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';
import { AuditLogging } from '../core/audit.decorator';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @SkipThrottle({ default: false })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 * 1000,
      path: '/',
    });
    if (result.refresh_token) {
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 3600 * 1000,
        path: '/api/auth',
      });
    }
    return result;
  }

  @Post('refresh')
  @Public()
  async refresh(@Body() dto: RefreshTokenDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refreshTokens(dto.refreshToken);
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 * 1000,
      path: '/',
    });
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
      path: '/api/auth',
    });
    return result;
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = (req as any).user?.userId;
    if (userId) await this.authService.revokeUserRefreshTokens(userId);
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth' });
    return { message: 'تم تسجيل الخروج بنجاح' };
  }

  @Post('logout-all')
  @Roles(...ROLES.ALL)
  async logoutAll(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.revokeUserRefreshTokens((req as any).user.userId);
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth' });
    return { message: 'تم تسجيل الخروج من جميع الأجهزة' };
  }

  @Get('profile')
  @Roles(...ROLES.ALL)
  getProfile(@Req() req: Request) {
    return this.authService.getProfile((req as any).user.userId);
  }

  @Put('profile')
  @Roles(...ROLES.ALL)
  updateProfile(@Body() dto: UpdateProfileDto, @Req() req: Request) {
    return this.authService.updateProfile((req as any).user.userId, dto);
  }

  @Get('locations')
  @Roles(...ROLES.ALL)
  getLocations(
    @Query('field') field: string,
    @Query('parentField') parentField?: string,
    @Query('parentValue') parentValue?: string,
  ) {
    return this.authService.getLocations(field as any, parentField, parentValue);
  }

  @Post('change-password')
  @Roles(...ROLES.ALL)
  changePassword(@Body() dto: ChangePasswordDto, @Req() req: Request) {
    return this.authService.changePassword((req as any).user.userId, dto);
  }

  @Get('users')
  @Roles(...ROLES.ADMIN_MANAGER_UP)
  listUsers(@Req() req: Request) {
    return this.authService.listUsers((req as any).user);
  }

  @Get('users/:id')
  @Roles(...ROLES.ADMIN_MANAGER_UP)
  getUser(@Param('id', ParseIntPipe) id: number) {
    return this.authService.getProfile(id);
  }

  @Post('users')
  @Roles(...ROLES.ADMIN_MANAGER_UP)
  @AuditLogging({ action: 'CREATE', resource: 'user' })
  createUser(@Body() dto: CreateUserDto) {
    return this.authService.createUser(dto);
  }

  @Put('users/:id')
  @Roles(...ROLES.ADMIN_MANAGER_UP)
  @AuditLogging({ action: 'UPDATE', resource: 'user', resourceIdParam: 'id' })
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateUserDto>) {
    return this.authService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @Roles(...ROLES.ADMIN_MANAGER_UP)
  @AuditLogging({ action: 'DELETE', resource: 'user', resourceIdParam: 'id' })
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.authService.deleteUser(id);
  }

  @Post('users/:id/reset-password')
  @Roles(...ROLES.ADMIN_MANAGER_UP)
  @AuditLogging({ action: 'RESET_PASSWORD', resource: 'user', resourceIdParam: 'id' })
  resetPassword(@Param('id', ParseIntPipe) id: number, @Body() dto: { password: string }) {
    return this.authService.updateUser(id, { password: dto.password });
  }
}
