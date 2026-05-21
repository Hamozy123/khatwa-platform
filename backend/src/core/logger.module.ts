import { Global, Module } from '@nestjs/common';
import { WinstonModule, utilities } from 'nest-winston';
import * as winston from 'winston';

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      levels: { error: 0, warn: 1, info: 2, debug: 3 },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'ISO' }),
            winston.format.ms(),
            utilities.format.nestLike('Khatwa', { colors: true, prettyPrint: true }),
          ),
        }),
      ],
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
