import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
