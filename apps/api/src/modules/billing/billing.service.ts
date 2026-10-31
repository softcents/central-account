import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import { PayInvoiceDto, SubscribeDto } from './dto/billing.dto';
import { BillingCycle, PlanTier } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // PLANS
  // -------------------------------------------------------------

  async getPlans() {
    return (this.prisma as any).plan.findMany({
      where: { is_active: true },
      orderBy: { price_monthly: 'asc' },
    });
  }

  // -------------------------------------------------------------
  // SUBSCRIPTIONS
  // -------------------------------------------------------------

  async getSubscription(tenantId: string, userId: string) {
    await this.verifyMembership(tenantId, userId);

    const subscription = await (this.prisma as any).subscription.findFirst({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      // Default to free
      const freePlan = await (this.prisma as any).plan.findUnique({
        where: { code: 'FREE' },
      });
      return {
        status: 'ACTIVE',
        billing_cycle: 'MONTHLY',
        plan: freePlan,
        isTrial: false,
      };
    }

    const now = new Date();
    const isTrial =
      subscription.status === 'TRIALING' &&
      subscription.trial_ends_at &&
      new Date(subscription.trial_ends_at) > now;

    let daysLeftInTrial = 0;
    if (isTrial && subscription.trial_ends_at) {
      daysLeftInTrial = Math.max(
        0,
        Math.ceil(
          (new Date(subscription.trial_ends_at).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
    }

    return {
      ...subscription,
      isTrial,
      daysLeftInTrial,
    };
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    await this.verifyRole(dto.tenantId, userId, ['OWNER', 'ADMIN', 'BILLING_ADMIN']);

    const plan = await (this.prisma as any).plan.findUnique({
      where: { code: dto.planCode },
    });
    if (!plan) throw new NotFoundException('Plan tier not found');

    const now = new Date();
    const periodEnd = new Date(now);
    if (dto.billingCycle === BillingCycle.YEARLY) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    let status = 'ACTIVE';
    let trialEndsAt: Date | undefined;

    // Check if eligible for 14-day trial on paid plan
    if (dto.startTrial && plan.code !== PlanTier.FREE) {
      status = 'TRIALING';
      trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    }

    // Upsert subscription for tenant
    const existing = await (this.prisma as any).subscription.findFirst({
      where: { tenant_id: dto.tenantId },
    });

    let subscription;
    if (existing) {
      subscription = await (this.prisma as any).subscription.update({
        where: { id: existing.id },
        data: {
          plan_id: plan.id,
          status,
          billing_cycle: dto.billingCycle,
          current_period_start: now,
          current_period_end: periodEnd,
          trial_ends_at: trialEndsAt,
          cancel_at_period_end: false,
        },
        include: { plan: true },
      });
    } else {
      subscription = await (this.prisma as any).subscription.create({
        data: {
          tenant_id: dto.tenantId,
          plan_id: plan.id,
          status,
          billing_cycle: dto.billingCycle,
          current_period_start: now,
          current_period_end: periodEnd,
          trial_ends_at: trialEndsAt,
        },
        include: { plan: true },
      });
    }

    // Generate an invoice if this is a paid plan and not a trial
    if (plan.code !== PlanTier.FREE && !dto.startTrial) {
      const amount =
        dto.billingCycle === BillingCycle.YEARLY
          ? plan.price_yearly
          : plan.price_monthly;

      const invCount = await (this.prisma as any).invoice.count();
      const invoiceNumber = `INV-${now.getFullYear()}-${String(invCount + 1).padStart(5, '0')}`;

      await (this.prisma as any).invoice.create({
        data: {
          invoice_number: invoiceNumber,
          tenant_id: dto.tenantId,
          subscription_id: subscription.id,
          amount,
          currency: plan.currency,
          status: 'PAID', // Auto-cleared in demo/instant mode
          billing_reason: `Subscription to ${plan.name} (${dto.billingCycle})`,
          line_items: [
            {
              description: `${plan.name} Plan - 1 ${dto.billingCycle.toLowerCase()} cycle`,
              amount,
              quantity: 1,
            },
          ],
          due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          paid_at: now,
        },
      });
    }

    // -----------------------------------------------------------------
    // ACTIVATE the tenant — this is where the org goes live
    // -----------------------------------------------------------------
    await (this.prisma as any).tenant.update({
      where: { id: dto.tenantId },
      data: { status: 'ACTIVE' },
    });

    return subscription;
  }

  async cancelSubscription(tenantId: string, userId: string) {
    await this.verifyRole(tenantId, userId, ['OWNER', 'ADMIN', 'BILLING_ADMIN']);

    const sub = await (this.prisma as any).subscription.findFirst({
      where: { tenant_id: tenantId },
    });
    if (!sub) throw new NotFoundException('Active subscription not found');

    return (this.prisma as any).subscription.update({
      where: { id: sub.id },
      data: { cancel_at_period_end: true },
    });
  }

  // -------------------------------------------------------------
  // INVOICES & PAYMENTS
  // -------------------------------------------------------------

  async getInvoices(tenantId: string, userId: string) {
    await this.verifyMembership(tenantId, userId);

    return (this.prisma as any).invoice.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      include: {
        payments: true,
      },
    });
  }

  async getInvoiceById(invoiceId: string, userId: string) {
    const invoice = await (this.prisma as any).invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: true,
        payments: true,
        subscription: { include: { plan: true } },
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    await this.verifyMembership(invoice.tenant_id, userId);

    return invoice;
  }

  async payInvoice(invoiceId: string, userId: string, dto: PayInvoiceDto) {
    const invoice = await (this.prisma as any).invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    await this.verifyRole(invoice.tenant_id, userId, ['OWNER', 'ADMIN', 'BILLING_ADMIN']);

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already paid');
    }

    const txId = 'TXN_' + crypto.randomBytes(8).toString('hex').toUpperCase();

    const [payment, updatedInvoice] = await Promise.all([
      (this.prisma as any).payment.create({
        data: {
          invoice_id: invoiceId,
          tenant_id: invoice.tenant_id,
          amount: invoice.amount,
          currency: invoice.currency,
          status: 'COMPLETED',
          payment_method: dto.paymentMethod || 'CARD',
          provider: 'MOCK_GATEWAY',
          transaction_id: txId,
        },
      }),
      (this.prisma as any).invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PAID',
          paid_at: new Date(),
        },
      }),
    ]);

    // Activate subscription if pending
    if (invoice.subscription_id) {
      await (this.prisma as any).subscription.update({
        where: { id: invoice.subscription_id },
        data: { status: 'ACTIVE' },
      });
    }

    return {
      success: true,
      transactionId: txId,
      invoice: updatedInvoice,
      payment,
    };
  }

  // -------------------------------------------------------------
  // PHASE 3: SUBSCRIPTION HEALTH, GRACE PERIOD & AUTO-RENEWAL
  // -------------------------------------------------------------

  async checkSubscriptionHealth(tenantId: string, userId: string) {
    await this.verifyMembership(tenantId, userId);

    const sub = await (this.prisma as any).subscription.findFirst({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      include: { plan: true },
    });

    if (!sub) {
      return {
        status: 'ACTIVE',
        isFree: true,
        inGracePeriod: false,
        daysLeftInGrace: 0,
        requiresAction: false,
      };
    }

    const now = new Date();
    const periodEnd = new Date(sub.current_period_end);
    const isExpired = periodEnd.getTime() < now.getTime();
    const GRACE_PERIOD_DAYS = 7;
    let daysPastDue = 0;
    let inGracePeriod = false;
    let daysLeftInGrace = 0;
    let currentStatus = sub.status;

    if (isExpired && sub.status !== 'CANCELLED') {
      daysPastDue = Math.max(
        0,
        Math.floor((now.getTime() - periodEnd.getTime()) / (1000 * 60 * 60 * 24)),
      );

      if (daysPastDue <= GRACE_PERIOD_DAYS) {
        inGracePeriod = true;
        daysLeftInGrace = GRACE_PERIOD_DAYS - daysPastDue;
        if (sub.status !== 'PAST_DUE') {
          currentStatus = 'PAST_DUE';
          await (this.prisma as any).subscription.update({
            where: { id: sub.id },
            data: { status: 'PAST_DUE' },
          });
        }
      } else {
        inGracePeriod = false;
        daysLeftInGrace = 0;
        if (sub.status !== 'EXPIRED') {
          currentStatus = 'EXPIRED';
          await (this.prisma as any).subscription.update({
            where: { id: sub.id },
            data: { status: 'EXPIRED' },
          });
          // Suspend tenant access if grace period has completely lapsed
          await (this.prisma as any).tenant.update({
            where: { id: tenantId },
            data: { status: 'SUSPENDED' },
          });
        }
      }
    }

    return {
      subscriptionId: sub.id,
      status: currentStatus,
      plan: sub.plan,
      billingCycle: sub.billing_cycle,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      isExpired,
      daysPastDue,
      inGracePeriod,
      daysLeftInGrace,
      gracePeriodTotalDays: GRACE_PERIOD_DAYS,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      requiresAction: inGracePeriod || currentStatus === 'EXPIRED',
    };
  }

  async renewSubscription(tenantId: string, userId: string) {
    await this.verifyRole(tenantId, userId, ['OWNER', 'ADMIN', 'BILLING_ADMIN']);

    const sub = await (this.prisma as any).subscription.findFirst({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      include: { plan: true },
    });

    if (!sub) {
      throw new NotFoundException('Active subscription not found for renewal');
    }

    const now = new Date();
    const newPeriodStart = now;
    const newPeriodEnd = new Date(now);

    if (sub.billing_cycle === BillingCycle.YEARLY) {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    } else {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    }

    const plan = sub.plan;
    const amount =
      sub.billing_cycle === BillingCycle.YEARLY
        ? plan.price_yearly
        : plan.price_monthly;

    const invCount = await (this.prisma as any).invoice.count();
    const invoiceNumber = `INV-${now.getFullYear()}-${String(invCount + 1).padStart(5, '0')}`;

    const [updatedSub, newInvoice] = await (this.prisma as any).$transaction(async (tx: any) => {
      const invoice = await tx.invoice.create({
        data: {
          invoice_number: invoiceNumber,
          tenant_id: tenantId,
          subscription_id: sub.id,
          amount,
          currency: plan.currency,
          status: 'PAID',
          billing_reason: `Renewal of ${plan.name} (${sub.billing_cycle})`,
          line_items: [
            {
              description: `${plan.name} Plan - Renewal cycle`,
              amount,
              quantity: 1,
            },
          ],
          due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          paid_at: now,
        },
      });

      const subscription = await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'ACTIVE',
          current_period_start: newPeriodStart,
          current_period_end: newPeriodEnd,
          cancel_at_period_end: false,
        },
        include: { plan: true },
      });

      // Ensure tenant is active
      await tx.tenant.update({
        where: { id: tenantId },
        data: { status: 'ACTIVE' },
      });

      return [subscription, invoice];
    });

    return {
      success: true,
      message: 'Subscription successfully renewed',
      subscription: updatedSub,
      invoice: newInvoice,
    };
  }

  // -------------------------------------------------------------
  // PERMISSION HELPERS
  // -------------------------------------------------------------

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
        `Insufficient billing permissions. Required: ${allowedRoles.join(' or ')}`,
      );
    }
    return member;
  }
}
