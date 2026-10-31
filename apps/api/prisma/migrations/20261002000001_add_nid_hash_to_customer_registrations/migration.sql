-- AlterTable
-- Safe migration for live table with existing rows:
-- In PostgreSQL 11+, ADD COLUMN with a constant DEFAULT or NULL is a fast metadata-only operation
-- that does not rewrite table data or hold a prolonged lock.
ALTER TABLE "customer_registrations" 
  ADD COLUMN IF NOT EXISTS "nid_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "nid_hash_version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
-- Creates an index on nid_hash for performant blind-index lookups.
CREATE INDEX IF NOT EXISTS "customer_registrations_nid_hash_idx" ON "customer_registrations"("nid_hash");
