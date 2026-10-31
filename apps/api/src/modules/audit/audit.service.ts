import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export enum AuditEventType {
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  KYC_CUSTOMER_REGISTRATION_COMPLETED = 'KYC_CUSTOMER_REGISTRATION_COMPLETED',
}

export interface CreateAuditLogParams {
  userId?: string | null;
  eventType: AuditEventType | string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
  tenantId?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Append-only event logging.
   * Note: As per security requirements, update and delete operations are strictly prohibited.
   */
  async logEvent(params: CreateAuditLogParams) {
    try {
      const log = await this.prisma.auditLog.create({
        data: {
          user_id: params.userId || null,
          event_type: params.eventType,
          ip_address: params.ipAddress || null,
          user_agent: params.userAgent || null,
          metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
          tenant_id: params.tenantId || null,
        },
      });
      return log;
    } catch (error) {
      this.logger.error(`Failed to record audit log: ${params.eventType}`, error);
      // We log error but don't crash the request if audit logging fails
      return null;
    }
  }

  async getLogsForUser(userId: string, limit = 20) {
    return this.prisma.auditLog.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }
}
