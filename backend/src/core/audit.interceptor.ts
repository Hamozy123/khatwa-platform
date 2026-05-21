import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AuditLogService } from './audit-log.service';
import { AUDIT_KEY, AuditOptions } from './audit.decorator';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditOptions = this.reflector.getAllAndOverride<AuditOptions>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!auditOptions) return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const user = (req as any).user;
    const resourceId = auditOptions.resourceIdParam ? req.params[auditOptions.resourceIdParam] : undefined;

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditLogService.log({
            userId: user?.userId,
            username: user?.username,
            action: auditOptions.action,
            resource: auditOptions.resource,
            resourceId,
            ipAddress: req.ip,
          }).catch(() => {});
        },
        error: () => {
          this.auditLogService.log({
            userId: user?.userId,
            username: user?.username,
            action: `FAILED_${auditOptions.action}`,
            resource: auditOptions.resource,
            resourceId,
            details: { error: 'request failed' },
            ipAddress: req.ip,
          }).catch(() => {});
        },
      }),
    );
  }
}
