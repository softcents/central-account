import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { IdentityService } from './identity.service';
import { IdentityController } from './identity.controller';
import { ReviewController } from './review.controller';
import { InternalPythonProvider } from './providers/internal-python.provider';
import { DocumentStorageService } from './services/document-storage.service';
import { KycDecisionEngineService } from './services/kyc-decision-engine.service';
import { JobQueueService } from './services/job-queue.service';
import { EmailModule } from '../email/email.module';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';

@Module({
  imports: [EmailModule, JwtModule.register({})],
  controllers: [IdentityController, ReviewController],
  providers: [
    IdentityService,
    InternalPythonProvider,
    DocumentStorageService,
    KycDecisionEngineService,
    JobQueueService,
    AdminAuthGuard,
    AdminRolesGuard,
  ],
  exports: [IdentityService, JobQueueService, InternalPythonProvider, DocumentStorageService],
})
export class IdentityModule {}

