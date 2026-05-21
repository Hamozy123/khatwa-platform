import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Observable, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const correlationId = uuidv4();
    req.headers['x-correlation-id'] = correlationId;
    (req as any).correlationId = correlationId;

    const start = Date.now();
    const { method, originalUrl } = req;
    const userId = (req as any).user?.userId ?? 'anonymous';

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          this.logger.info('request completed', {
            correlationId,
            method,
            url: originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
            userId,
          });
        },
        error: (err: Error) => {
          this.logger.error('request failed', {
            correlationId,
            method,
            url: originalUrl,
            error: err.message,
            durationMs: Date.now() - start,
            userId,
          });
        },
      }),
    );
  }
}
