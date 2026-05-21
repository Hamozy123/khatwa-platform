import { Controller, Get } from '@nestjs/common';
import { Public } from '../core/public.decorator';

@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return { status: 'ok', service: 'khatwa-backend', timestamp: new Date().toISOString() };
  }
}
