import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { TenantModule } from '../tenant/tenant.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    TenantModule, // provides TenantService (for recordUsage)
  ],
  controllers: [PublicApiController],
  providers: [
    PublicApiService,
    ApiKeyGuard, // instantiated here so it can inject PrismaService + Reflector
  ],
})
export class PublicApiModule {}
