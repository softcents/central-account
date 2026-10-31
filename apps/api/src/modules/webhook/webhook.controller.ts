import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto } from './dto/webhook.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async createEndpoint(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhookService.createEndpoint(userId, dto);
  }

  @Get(':tenantId')
  async getEndpoints(
    @Param('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.webhookService.getEndpoints(tenantId, userId);
  }

  @Delete(':tenantId/:id')
  async deleteEndpoint(
    @Param('tenantId') tenantId: string,
    @Param('id') endpointId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.webhookService.deleteEndpoint(tenantId, userId, endpointId);
  }

  @Post(':tenantId/:id/test')
  async testPing(
    @Param('tenantId') tenantId: string,
    @Param('id') endpointId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.webhookService.testPing(tenantId, userId, endpointId);
  }
}
