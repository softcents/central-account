import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
    { code: 'JP', name: 'Japan', iso3: 'JPN', dial_code: '+81' },
    { code: 'KR', name: 'South Korea', iso3: 'KOR', dial_code: '+82' },
    { code: 'BR', name: 'Brazil', iso3: 'BRA', dial_code: '+55' },
  ];

  for (const c of countries) {
    await prisma.country.upsert({
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
    await prisma.documentType.upsert({
      where: { code: dt.code },
      update: {},
      create: dt,
    });
  }

  // Business Document Types
  const businessDocTypes = [
    { code: 'TRADE_LICENSE', name: 'Trade License / Business Registration Certificate', description: 'Primary government trade license or certificate of incorporation' },
    { code: 'TAX_CERTIFICATE', name: 'Tax / VAT Registration Certificate', description: 'Corporate TIN, EIN, or VAT registration document' },
    { code: 'MEMORANDUM', name: 'Articles of Association / Memorandum', description: 'Charter or partnership agreement document' },
  ];

  for (const bdt of businessDocTypes) {
    await prisma.businessDocumentType.upsert({
      where: { code: bdt.code },
      update: {},
      create: bdt,
    });
  }

  // Business Roles
  const roles = [
    { name: 'OWNER', permissions: ['manage_business', 'upload_documents', 'verify_business', 'invite_users', 'view_reports'] },
    { name: 'ADMIN', permissions: ['upload_documents', 'verify_business', 'invite_users', 'view_reports'] },
    { name: 'MANAGER', permissions: ['upload_documents', 'view_reports'] },
    { name: 'STAFF', permissions: ['view_reports'] },
    { name: 'VIEWER', permissions: ['view_status'] },
  ];

  for (const r of roles) {
    await prisma.businessRoleDef.upsert({
      where: { name: r.name },
      update: { permissions: r.permissions },
      create: r,
    });
  }

  // Internal Verification Provider
  await prisma.verificationProvider.upsert({
    where: { code: 'INTERNAL_PYTHON' },
    update: { is_active: true },
    create: {
      name: 'Internal Python AI Verification Service',
      code: 'INTERNAL_PYTHON',
      is_active: true,
      config: {
        baseUrl: process.env.PYTHON_VERIFICATION_URL || 'http://localhost:8000',
        sharedSecret: process.env.INTERNAL_SERVICE_SECRET || 'internal_kyc_kyb_secret_key_32chars',
      },
    },
  });

  // Seed SaaS Subscription Plans
  const plans = [
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

  for (const p of plans) {
    await (prisma as any).plan.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        description: p.description,
        price_monthly: p.price_monthly,
        price_yearly: p.price_yearly,
        max_users: p.max_users,
        max_kyc_monthly: p.max_kyc_monthly,
        max_kyb_monthly: p.max_kyb_monthly,
        max_api_calls_monthly: p.max_api_calls_monthly,
        max_connected_apps: p.max_connected_apps,
        storage_mb: p.storage_mb,
        features: p.features,
      },
      create: p,
    });
  }

  // Seed Default Super Admin User
  const argon2 = await import('argon2');
  const adminPasswordHash = await argon2.hash('AdminPassword123!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await (prisma as any).adminUser.upsert({
    where: { email: 'admin@centralidentity.com' },
    update: {
      password_hash: adminPasswordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
    create: {
      email: 'admin@centralidentity.com',
      password_hash: adminPasswordHash,
      first_name: 'Central',
      last_name: 'Administrator',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  // Seed default KYC & KYB reviewer admin accounts
  await (prisma as any).adminUser.upsert({
    where: { email: 'reviewer@centralidentity.com' },
    update: {},
    create: {
      email: 'reviewer@centralidentity.com',
      password_hash: adminPasswordHash,
      first_name: 'Senior',
      last_name: 'Reviewer',
      role: 'KYC_REVIEWER',
      status: 'ACTIVE',
    },
  });

  // Check if existing user exists to link a default Organization / Tenant
  const existingUser = await prisma.user.findFirst({
    where: { email: 'shovonislam493@gmail.com' },
  });

  if (existingUser) {
    const existingTenant = await (prisma as any).tenant.findFirst({
      where: { owner_id: existingUser.id },
    });

    if (!existingTenant) {
      const freePlan = await (prisma as any).plan.findUnique({ where: { code: 'FREE' } });
      const createdTenant = await (prisma as any).tenant.create({
        data: {
          name: 'Central Account HQ',
          slug: 'central-account-hq',
          owner_id: existingUser.id,
          status: 'ACTIVE',
          brand_color: '#3b82f6',
          members: {
            create: {
              user_id: existingUser.id,
              role: 'OWNER',
              permissions: ['all'],
            },
          },
        },
      });

      if (freePlan) {
        const periodEnd = new Date();
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);

        await (prisma as any).subscription.create({
          data: {
            tenant_id: createdTenant.id,
            plan_id: freePlan.id,
            status: 'ACTIVE',
            billing_cycle: 'MONTHLY',
            current_period_start: new Date(),
            current_period_end: periodEnd,
          },
        });
      }
    }
  }

  console.log('Phase 2, 3, Plans, Super Admin, and Tenant seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
