import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { TenantRole } from '@prisma/client';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty({ message: 'Organization name is required' })
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' })
  slug?: string;

  @IsOptional()
  @IsString()
  businessId?: string;
}

export class InviteMemberDto {
  @IsEmail({}, { message: 'Valid email address required' })
  email: string;

  @IsEnum(TenantRole, { message: 'Invalid tenant role' })
  role: TenantRole;
}

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty({ message: 'Key name is required' })
  name: string;

  @IsArray()
  @IsString({ each: true })
  scopes: string[];

  @IsOptional()
  @IsNumber()
  expiresInDays?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ipAllowlist?: string[];
}

export class UpdateBrandingDto {
  @IsOptional()
  @IsString()
  brandColor?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  customDomain?: string;
}

export class ConfigureProviderDto {
  @IsString()
  @IsNotEmpty({ message: 'Provider code is required (e.g. DATA_CHECK_SCRAPPER, ICC, CUSTOM_KYC)' })
  providerCode: string;

  @IsString()
  @IsNotEmpty({ message: 'API key is required' })
  apiKey: string;

  @IsOptional()
  @IsString()
  apiSecret?: string;

  @IsOptional()
  @IsString()
  apiUrl?: string;

  @IsOptional()
  isEnabled?: boolean;

  @IsOptional()
  isPrimary?: boolean;

  @IsOptional()
  additionalConfig?: Record<string, any>;
}

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty({ message: 'Customer full name is required' })
  name: string;

  @IsEmail({}, { message: 'Valid customer email required' })
  email: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  customerType?: 'INDIVIDUAL' | 'COMPANY';

  @IsOptional()
  metadata?: Record<string, any>;
}

export class CustomerDecisionDto {
  @IsString()
  @IsNotEmpty({ message: 'Decision action is required (APPROVE, REJECT, REQUEST_REVERIFICATION)' })
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REVERIFICATION';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCustomDomainDto {
  @IsString()
  @IsNotEmpty({ message: 'Custom domain is required (e.g. auth.yourcompany.com)' })
  @Matches(
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
    { message: 'Must be a valid fully-qualified domain name (e.g. auth.yourcompany.com)' },
  )
  domain: string;
}

