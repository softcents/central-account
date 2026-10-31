import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BillingCycle, PlanTier } from '@prisma/client';

export class SubscribeDto {
  @IsString()
  @IsNotEmpty({ message: 'Tenant ID is required' })
  tenantId: string;

  @IsEnum(PlanTier, { message: 'Invalid plan tier' })
  planCode: PlanTier;

  @IsEnum(BillingCycle, { message: 'Invalid billing cycle' })
  billingCycle: BillingCycle;

  @IsOptional()
  @IsBoolean()
  startTrial?: boolean;
}

export class PayInvoiceDto {
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  cardNumber?: string;
}
