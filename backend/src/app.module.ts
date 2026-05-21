import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { IepModule } from './iep/iep.module';
import { ReportsModule } from './reports/reports.module';
import { MediaModule } from './media/media.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BehaviorModule } from './behavior/behavior.module';
import { InclusionModule } from './inclusion/inclusion.module';
import { DailyPlanModule } from './daily-plan/daily-plan.module';
import { LocationsModule } from './locations/locations.module';
import { HealthModule } from './health/health.module';
import { RtiModule } from './rti/rti.module';
import { EarlyWarningModule } from './early-warning/early-warning.module';
import { FbaModule } from './fba/fba.module';
import { AbcModule } from './abc/abc.module';
import { ParentModule } from './parent/parent.module';
import { PrivacyModule } from './privacy/privacy.module';
import { AttendanceModule } from './attendance/attendance.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LoggerModule } from './core/logger.module';
import { LoggingInterceptor } from './core/logging.interceptor';
import { SecurityHeadersMiddleware } from './core/security-headers.middleware';
import { PiiAccessLogMiddleware } from './privacy/pii-access-log.middleware';
import { AuditModule } from './core/audit.module';
import { AuditInterceptor } from './core/audit.interceptor';
import { RolesGuard } from './core/roles.guard';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
        useFactory: (config: ConfigService) => {
        const dbUrl = config.get('DATABASE_URL');
        if (dbUrl) {
          return {
            type: 'postgres',
            url: dbUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            ssl: { rejectUnauthorized: false },
          };
        }
        return {
          type: 'postgres',
          host: config.get('DATABASE_HOST', 'localhost'),
          port: Number(config.get('DATABASE_PORT', 5432)),
          username: config.get('DATABASE_USERNAME', 'khatwa'),
          password: config.get('DATABASE_PASSWORD', 'khatwa_pass'),
          database: config.get('DATABASE_NAME', 'khatwa_db'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          ssl: config.get('PGSSLMODE') === 'require' ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    LoggerModule,
    AuditModule,
    AuthModule,
    StudentsModule,
    IepModule,
    ReportsModule,
    MediaModule,
    NotificationsModule,
    BehaviorModule,
    InclusionModule,
    DailyPlanModule,
    LocationsModule,
    HealthModule,
    RtiModule,
    EarlyWarningModule,
    FbaModule,
    AbcModule,
    ParentModule,
    PrivacyModule,
    AttendanceModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
    consumer.apply(PiiAccessLogMiddleware).forRoutes('students/:id', 'students/:id/export', 'privacy/*');
  }
}
