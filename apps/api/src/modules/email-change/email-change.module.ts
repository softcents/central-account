import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailChangeService } from './email-change.service';
import { EmailChangeController } from './email-change.controller';
import { InternalEmailChangeController } from './internal-email-change.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, ConfigModule, AuditModule, EmailModule],
  controllers: [EmailChangeController, InternalEmailChangeController],
  providers: [EmailChangeService],
  exports: [EmailChangeService],
})
export class EmailChangeModule {}
