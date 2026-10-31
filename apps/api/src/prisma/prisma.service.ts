import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { getComputedNidHash } from '../common/utils/nid.util';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
    const extended = this.$extends({
      query: {
        customerRegistration: {
          async create({ args, query }) {
            if (args.data && 'nid_passport_number' in args.data) {
              const rawNid = args.data.nid_passport_number;
              args.data.nid_hash = getComputedNidHash(rawNid, process.env.NID_HMAC_KEY);
              args.data.nid_hash_version = 1;
            }
            return query(args);
          },
          async update({ args, query }) {
            if (args.data && 'nid_passport_number' in args.data) {
              const raw = args.data.nid_passport_number;
              const rawNid =
                typeof raw === 'object' && raw !== null && 'set' in raw
                  ? (raw as any).set
                  : raw;
              args.data.nid_hash = getComputedNidHash(rawNid, process.env.NID_HMAC_KEY);
              args.data.nid_hash_version = 1;
            }
            return query(args);
          },
          async upsert({ args, query }) {
            if (args.create && 'nid_passport_number' in args.create) {
              const rawNid = args.create.nid_passport_number;
              args.create.nid_hash = getComputedNidHash(rawNid, process.env.NID_HMAC_KEY);
              args.create.nid_hash_version = 1;
            }
            if (args.update && 'nid_passport_number' in args.update) {
              const raw = args.update.nid_passport_number;
              const rawNid =
                typeof raw === 'object' && raw !== null && 'set' in raw
                  ? (raw as any).set
                  : raw;
              args.update.nid_hash = getComputedNidHash(rawNid, process.env.NID_HMAC_KEY);
              args.update.nid_hash_version = 1;
            }
            return query(args);
          },
          async createMany({ args, query }) {
            if (Array.isArray(args.data)) {
              for (const item of args.data) {
                if (item && 'nid_passport_number' in item) {
                  item.nid_hash = getComputedNidHash(item.nid_passport_number, process.env.NID_HMAC_KEY);
                  item.nid_hash_version = 1;
                }
              }
            } else if (
              args.data &&
              typeof args.data === 'object' &&
              'nid_passport_number' in args.data
            ) {
              (args.data as any).nid_hash = getComputedNidHash(
                (args.data as any).nid_passport_number,
                process.env.NID_HMAC_KEY,
              );
              (args.data as any).nid_hash_version = 1;
            }
            return query(args);
          },
          async updateMany({ args, query }) {
            if (args.data && 'nid_passport_number' in args.data) {
              const raw = args.data.nid_passport_number;
              const rawNid =
                typeof raw === 'object' && raw !== null && 'set' in raw
                  ? (raw as any).set
                  : raw;
              args.data.nid_hash = getComputedNidHash(rawNid, process.env.NID_HMAC_KEY);
              args.data.nid_hash_version = 1;
            }
            return query(args);
          },
        },
      },
    });
    return extended as unknown as PrismaService;
  }

  async onModuleInit() {
    await this.$connect();
    await this.ensureSeedData();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Ensures essential default database records exist on startup.
   * Runs idempotently so existing data is never overwritten.
   */
  private async ensureSeedData() {
    try {
      // 1. Check if admin user exists
      const adminCount = await (this as any).adminUser.count();
      if (adminCount === 0) {
        this.logger.log('[PrismaService] Initializing default administrative accounts and plans...');

        const adminPasswordHash = await argon2.hash('AdminPassword123!', {
          type: argon2.argon2id,
          memoryCost: 65536,
          timeCost: 3,
          parallelism: 4,
        });

        // Seed Super Admin
        await (this as any).adminUser.upsert({
          where: { email: 'admin@centralidentity.com' },
          update: {},
          create: {
            email: 'admin@centralidentity.com',
            password_hash: adminPasswordHash,
            first_name: 'Central',
            last_name: 'Administrator',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
          },
        });

        // Seed KYC Reviewer
        await (this as any).adminUser.upsert({
          where: { email: 'reviewer@centralidentity.com' },
          update: {},
          create: {
            email: 'reviewer@centralidentity.com',
            password_hash: adminPasswordHash,
            first_name: 'Compliance',
            last_name: 'Reviewer',
            role: 'KYC_REVIEWER',
            status: 'ACTIVE',
          },
        });

        this.logger.log('[PrismaService] Default admin accounts provisioned (admin@centralidentity.com)');
      }

      // 2. Check SaaS Subscription Plans
      const planCount = await (this as any).plan.count();
      if (planCount === 0) {
        const defaultPlans = [
          {
            code: 'FREE',
            name: 'Free Starter',
            description: 'Ideal for individual developers and small testing projects.',
            price_monthly: 0,
            price_yearly: 0,
            currency: 'USD',
            max_users: 3,
            max_kyc_monthly: 10,
            max_kyb_monthly: 2,
            max_api_calls_monthly: 1000,
            max_connected_apps: 2,
            storage_mb: 250,
            features: ['Basic KYC Verification', 'OIDC SSO Integration', 'Community Support', 'Standard Rate Limit'],
            is_active: true,
          },
          {
            code: 'STARTER',
            name: 'Startup Growth',
            description: 'Perfect for small teams and launching applications.',
            price_monthly: 29,
            price_yearly: 290,
            currency: 'USD',
            max_users: 10,
            max_kyc_monthly: 150,
            max_kyb_monthly: 25,
            max_api_calls_monthly: 10000,
            max_connected_apps: 5,
            storage_mb: 2000,
            features: ['Advanced Biometric KYC', 'Trade License KYB', 'Webhook Notifications', 'Email Support', 'API Keys'],
            is_active: true,
          },
          {
            code: 'BUSINESS',
            name: 'Business Pro',
            description: 'For scaling companies requiring high throughput and team management.',
            price_monthly: 99,
            price_yearly: 990,
            currency: 'USD',
            max_users: 50,
            max_kyc_monthly: 1000,
            max_kyb_monthly: 100,
            max_api_calls_monthly: 75000,
            max_connected_apps: 20,
            storage_mb: 15000,
            features: ['Priority Liveness & KYC', 'Multi-Member RBAC', 'Custom Webhooks', 'Priority Support', 'White-Label Branding', '90-Day Audit Retention'],
            is_active: true,
          },
          {
            code: 'PRO',
            name: 'Scale & FinTech',
            description: 'Dedicated volume and compliance controls for fintech and enterprises.',
            price_monthly: 249,
            price_yearly: 2490,
            currency: 'USD',
            max_users: 250,
            max_kyc_monthly: 5000,
            max_kyb_monthly: 500,
            max_api_calls_monthly: 500000,
            max_connected_apps: 50,
            storage_mb: 50000,
            features: ['Automated Biometrics & Anti-Spoof', 'Multi-Region Support', '24/7 SLA Support', 'Full White-Label', 'Custom Domain SSO', '1-Year Audit Retention'],
            is_active: true,
          },
          {
            code: 'ENTERPRISE',
            name: 'Enterprise Custom',
            description: 'Maximum security, custom quotas, and dedicated infrastructure.',
            price_monthly: 999,
            price_yearly: 9990,
            currency: 'USD',
            max_users: 999999,
            max_kyc_monthly: 999999,
            max_kyb_monthly: 999999,
            max_api_calls_monthly: 9999999,
            max_connected_apps: 999,
            storage_mb: 500000,
            features: ['Unlimited Scale', 'Custom SLA Guarantee', 'Dedicated Solutions Architect', 'Custom Compliance Export', 'Custom AI Models', 'Indefinite Audit Logs'],
            is_active: true,
          },
        ];

        for (const p of defaultPlans) {
          await (this as any).plan.upsert({
            where: { code: p.code },
            update: {},
            create: p,
          });
        }
        this.logger.log('[PrismaService] Default subscription plans provisioned');
      }

      // 3. Ensure Countries and Document Types
      const countryCount = await (this as any).country.count();
      if (countryCount === 0) {
        const countries = [
          { code: 'BD', name: 'Bangladesh', iso3: 'BGD', dial_code: '+880' },
          { code: 'US', name: 'United States', iso3: 'USA', dial_code: '+1' },
          { code: 'GB', name: 'United Kingdom', iso3: 'GBR', dial_code: '+44' },
          { code: 'CA', name: 'Canada', iso3: 'CAN', dial_code: '+1' },
          { code: 'AU', name: 'Australia', iso3: 'AUS', dial_code: '+61' },
          { code: 'DE', name: 'Germany', iso3: 'DEU', dial_code: '+49' },
          { code: 'FR', name: 'France', iso3: 'FRA', dial_code: '+33' },
          { code: 'IN', name: 'India', iso3: 'IND', dial_code: '+91' },
          { code: 'SG', name: 'Singapore', iso3: 'SGP', dial_code: '+65' },
          { code: 'MY', name: 'Malaysia', iso3: 'MYS', dial_code: '+60' },
          { code: 'AE', name: 'United Arab Emirates', iso3: 'ARE', dial_code: '+971' },
          { code: 'SA', name: 'Saudi Arabia', iso3: 'SAU', dial_code: '+966' },
        ];
        for (const c of countries) {
          await (this as any).country.upsert({
            where: { code: c.code },
            update: {},
            create: c,
          });
        }

        const documentTypes = [
          { code: 'PASSPORT', name: 'Passport', description: 'International biometric passport' },
          { code: 'NATIONAL_ID', name: 'National Identity Card', description: 'Government-issued national identity card' },
          { code: 'DRIVING_LICENSE', name: 'Driving License', description: 'State or country motor vehicle driving permit' },
        ];
        for (const dt of documentTypes) {
          await (this as any).documentType.upsert({
            where: { code: dt.code },
            update: {},
            create: dt,
          });
        }
        this.logger.log('[PrismaService] Default countries and document types provisioned');
      }
    } catch (err: any) {
      this.logger.warn(`[PrismaService] Seed check skipped: ${err.message}`);
    }
  }
}
