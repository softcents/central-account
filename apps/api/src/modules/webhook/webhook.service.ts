import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import { CreateWebhookDto } from './dto/webhook.dto';
import { JobQueueService } from '../identity/services/job-queue.service';

@Injectable()
export class WebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobQueue: JobQueueService,
  ) {}

  async createEndpoint(userId: string, dto: CreateWebhookDto) {
    await this.verifyRole(dto.tenantId, userId, ['OWNER', 'ADMIN']);

    const secret = 'whsec_' + crypto.randomBytes(24).toString('hex');

    return (this.prisma as any).webhookEndpoint.create({
      data: {
        tenant_id: dto.tenantId,
        url: dto.url,
        secret,
        events: dto.events,
        is_active: true,
      },
    });
  }

  async getEndpoints(tenantId: string, userId: string) {
    await this.verifyMembership(tenantId, userId);

    return (this.prisma as any).webhookEndpoint.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      include: {
        deliveries: {
          take: 5,
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }

  async deleteEndpoint(tenantId: string, userId: string, endpointId: string) {
    await this.verifyRole(tenantId, userId, ['OWNER', 'ADMIN']);

    const endpoint = await (this.prisma as any).webhookEndpoint.findUnique({
      where: { id: endpointId },
    });

    if (!endpoint || endpoint.tenant_id !== tenantId) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    await (this.prisma as any).webhookEndpoint.delete({
      where: { id: endpointId },
    });

    return { success: true };
  }

  async testPing(tenantId: string, userId: string, endpointId: string) {
    await this.verifyRole(tenantId, userId, ['OWNER', 'ADMIN']);

    const endpoint = await (this.prisma as any).webhookEndpoint.findUnique({
      where: { id: endpointId },
    });
    if (!endpoint) throw new NotFoundException('Endpoint not found');

    const testPayload = {
      event: 'test.ping',
      timestamp: new Date().toISOString(),
      tenantId,
      data: { message: 'Central Account Webhook Test Ping' },
    };

    await this.jobQueue.enqueueWebhookDelivery({
      endpointId: endpoint.id,
      event: 'test.ping',
      payload: testPayload,
    });

    return {
      success: true,
      message: 'Webhook ping delivery enqueued in background processor',
    };
  }

  async dispatch(tenantId: string, event: string, payload: any) {
    const endpoints = await (this.prisma as any).webhookEndpoint.findMany({
      where: {
        tenant_id: tenantId,
        is_active: true,
      },
    });

    for (const ep of endpoints) {
      if (ep.events.includes('*') || ep.events.includes(event)) {
        await this.jobQueue.enqueueWebhookDelivery({
          endpointId: ep.id,
          event,
          payload,
        });
      }
    }
  }

  private async deliver(endpoint: any, event: string, payload: any) {
    const timestamp = Math.floor(Date.now() / 1000);
    const bodyStr = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', endpoint.secret)
      .update(`${timestamp}.${bodyStr}`)
      .digest('hex');

    let responseStatus: number | null = null;
    let responseBody = '';
    let success = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Central-Identity-Event': event,
          'X-Central-Identity-Timestamp': String(timestamp),
          'X-Central-Identity-Signature': `t=${timestamp},v1=${signature}`,
        },
        body: bodyStr,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      responseStatus = res.status;
      responseBody = (await res.text()).substring(0, 500);
      success = res.ok;
    } catch (err: any) {
      responseBody = err.message || 'Network error';
    }

    const delivery = await (this.prisma as any).webhookDelivery.create({
      data: {
        endpoint_id: endpoint.id,
        event,
        payload,
        response_status: responseStatus,
        response_body: responseBody,
        success,
      },
    });

    return {
      success,
      responseStatus,
      deliveryId: delivery.id,
    };
  }

  private async verifyMembership(tenantId: string, userId: string) {
    const member = await (this.prisma as any).tenantMember.findUnique({
      where: {
        tenant_id_user_id: {
          tenant_id: tenantId,
          user_id: userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('Access denied to this tenant');
    }
    return member;
  }

  private async verifyRole(tenantId: string, userId: string, allowedRoles: string[]) {
    const member = await this.verifyMembership(tenantId, userId);
    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException(
        `Insufficient webhook permissions. Required: ${allowedRoles.join(' or ')}`,
      );
    }
    return member;
  }
}
