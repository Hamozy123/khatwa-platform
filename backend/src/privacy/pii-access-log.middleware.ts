import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { PiiAccessLog } from './pii-access-log.entity';

@Injectable()
export class PiiAccessLogMiddleware implements NestMiddleware {
  private logRepo: any;

  constructor(private readonly dataSource: DataSource) {}

  use(req: Request, res: Response, next: NextFunction) {
    const originalSend = res.send.bind(res);
    res.send = (body: any) => {
      const piiEndpoints = ['/students/', '/privacy/'];
      const isPii = piiEndpoints.some((p) => req.path.startsWith(p));

      if (isPii && (req as any).user) {
        const user = (req as any).user;
        const studentId = req.params.id || req.params.studentId || 0;

        if (!this.logRepo) {
          this.logRepo = this.dataSource.getRepository(PiiAccessLog);
        }

        this.logRepo.save({
          userId: user.id || 0,
          userRole: user.role || 'unknown',
          action: req.method,
          resource: req.path,
          resourceId: Number(studentId) || 0,
          studentId: Number(studentId) || undefined,
          ipAddress: req.ip,
          granted: res.statusCode < 400,
          reason: `${req.method} ${req.path}`,
        }).catch(() => {});
      }

      return originalSend(body);
    };

    next();
  }
}
