import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { PayInvoiceDto, SubscribeDto } from './dto/billing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Get('plans')
  async getPlans() {
    return this.billingService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription/:tenantId')
  async getSubscription(
    @Param('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.getSubscription(tenantId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  async subscribe(
    @CurrentUser('id') userId: string,
    @Body() dto: SubscribeDto,
  ) {
    return this.billingService.subscribe(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel/:tenantId')
  async cancelSubscription(
    @Param('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.cancelSubscription(tenantId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('invoices/:tenantId')
  async getInvoices(
    @Param('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.getInvoices(tenantId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('invoices/detail/:invoiceId')
  async getInvoiceById(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.getInvoiceById(invoiceId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invoices/:invoiceId/pay')
  async payInvoice(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: PayInvoiceDto,
  ) {
    return this.billingService.payInvoice(invoiceId, userId, dto);
  }

  // Phase 3: Subscription Health & Grace Period Status
  @UseGuards(JwtAuthGuard)
  @Get('subscription/:tenantId/health')
  async checkSubscriptionHealth(
    @Param('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.checkSubscriptionHealth(tenantId, userId);
  }

  // Phase 3: Subscription Renewal
  @UseGuards(JwtAuthGuard)
  @Post('subscription/:tenantId/renew')
  async renewSubscription(
    @Param('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.renewSubscription(tenantId, userId);
  }
}
