-- Migration: Phase 1 Tenant Customers, Custom Domains & Provider Credentials
-- Safe, idempotent, non-blocking additions

DO $$ BEGIN
    CREATE TYPE "CustomDomainStatus" AS ENUM ('PENDING_DNS', 'VERIFIED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable custom_domains
CREATE TABLE IF NOT EXISTS "custom_domains" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "verification_token" TEXT NOT NULL,
    "status" "CustomDomainStatus" NOT NULL DEFAULT 'PENDING_DNS',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "ssl_status" TEXT NOT NULL DEFAULT 'PENDING',
    "last_verified_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable tenant_customers
CREATE TABLE IF NOT EXISTS "tenant_customers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "customer_type" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verification_level" "VerificationLevel" NOT NULL DEFAULT 'LEVEL_0',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable tenant_provider_configs
CREATE TABLE IF NOT EXISTS "tenant_provider_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "provider_code" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "api_key_encrypted" TEXT NOT NULL,
    "api_secret_encrypted" TEXT,
    "api_url" TEXT,
    "additional_config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_provider_configs_pkey" PRIMARY KEY ("id")
);

-- AlterTable identity_verifications
ALTER TABLE "identity_verifications"
    ADD COLUMN IF NOT EXISTS "customer_id" TEXT,
    ADD COLUMN IF NOT EXISTS "reviewed_by_type" TEXT DEFAULT 'PLATFORM',
    ADD COLUMN IF NOT EXISTS "reviewed_by_id" TEXT;

-- AlterTable business_verifications
ALTER TABLE "business_verifications"
    ADD COLUMN IF NOT EXISTS "customer_id" TEXT,
    ADD COLUMN IF NOT EXISTS "reviewed_by_type" TEXT DEFAULT 'PLATFORM',
    ADD COLUMN IF NOT EXISTS "reviewed_by_id" TEXT;

-- Unique Constraints and Indices
CREATE UNIQUE INDEX IF NOT EXISTS "custom_domains_domain_key" ON "custom_domains"("domain");
CREATE INDEX IF NOT EXISTS "custom_domains_tenant_id_idx" ON "custom_domains"("tenant_id");
CREATE INDEX IF NOT EXISTS "custom_domains_domain_idx" ON "custom_domains"("domain");

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_customers_tenant_id_email_key" ON "tenant_customers"("tenant_id", "email");
CREATE INDEX IF NOT EXISTS "tenant_customers_tenant_id_idx" ON "tenant_customers"("tenant_id");

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_provider_configs_tenant_id_provider_code_key" ON "tenant_provider_configs"("tenant_id", "provider_code");
CREATE INDEX IF NOT EXISTS "tenant_provider_configs_tenant_id_idx" ON "tenant_provider_configs"("tenant_id");

CREATE INDEX IF NOT EXISTS "identity_verifications_tenant_id_idx" ON "identity_verifications"("tenant_id");
CREATE INDEX IF NOT EXISTS "identity_verifications_customer_id_idx" ON "identity_verifications"("customer_id");

CREATE INDEX IF NOT EXISTS "business_verifications_tenant_id_idx" ON "business_verifications"("tenant_id");
CREATE INDEX IF NOT EXISTS "business_verifications_customer_id_idx" ON "business_verifications"("customer_id");

-- Foreign Keys
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'custom_domains_tenant_id_fkey') THEN
        ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_customers_tenant_id_fkey') THEN
        ALTER TABLE "tenant_customers" ADD CONSTRAINT "tenant_customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_provider_configs_tenant_id_fkey') THEN
        ALTER TABLE "tenant_provider_configs" ADD CONSTRAINT "tenant_provider_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'identity_verifications_customer_id_fkey') THEN
        ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tenant_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'business_verifications_customer_id_fkey') THEN
        ALTER TABLE "business_verifications" ADD CONSTRAINT "business_verifications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tenant_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
