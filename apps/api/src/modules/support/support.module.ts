import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { InternalSupportController } from './internal-support.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, AuditModule, EmailModule],
  controllers: [SupportController, InternalSupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
