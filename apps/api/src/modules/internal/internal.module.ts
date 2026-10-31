import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { json } from 'express';
import { NidCheckController } from './nid-check.controller';
import { NidCheckService } from './nid-check.service';
import { NidLookupController } from './nid-lookup.controller';
import { NidLookupService } from './nid-lookup.service';
import { InternalApiKeyGuard } from './guards/internal-api-key.guard';
import { InternalFileController } from './internal-file.controller';
import { InternalFileService } from './internal-file.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NidCheckController, NidLookupController, InternalFileController],
  providers: [NidCheckService, NidLookupService, InternalApiKeyGuard, InternalFileService],
})
export class InternalModule implements NestModule {
  /**
   * Apply a 1 KB request body cap specifically for internal NID routes.
   * This runs before the global limit and prevents large payload DoS attempts.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(json({ limit: '1kb' }))
      .forRoutes(
        {
          path: 'internal/nid-check',
          method: RequestMethod.POST,
        },
        {
          path: 'internal/nid-lookup',
          method: RequestMethod.POST,
        },
      );
  }
}
