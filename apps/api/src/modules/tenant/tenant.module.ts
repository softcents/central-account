import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantIsolationGuard } from '../../common/guards/tenant-isolation.guard';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [TenantController],
  providers: [TenantService, TenantIsolationGuard],
  exports: [TenantService, TenantIsolationGuard],
})
export class TenantModule {}


