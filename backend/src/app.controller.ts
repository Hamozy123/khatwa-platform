import { Controller, Get } from '@nestjs/common';
import { Public } from './core/public.decorator';

@Controller()
export class AppController {
  @Get()
  @Public()
  health() {
    return { status: 'ok', service: 'khatwa-backend' };
  }
}
