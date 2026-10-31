import { Module } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { MfaController } from './mfa.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [MfaController],
  providers: [MfaService],
  exports: [MfaService],
})
export class MfaModule {}
