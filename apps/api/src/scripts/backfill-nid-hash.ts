/**
 * Idempotent NID hash backfill script for production and local environments.
 *
 * Computes HMAC-SHA256(NID_HMAC_KEY, normalized_nid) for existing
 * CustomerRegistration records that do not yet have a nid_hash.
 *
 * Uses the shared getComputedNidHash utility to ensure identical normalization
 * (10, 13, or 17 digits only; non-NID / passport values remain null).
 *
 * Usage:
 *   # Dry-run (default — counts only, no database writes):
 *   node dist/scripts/backfill-nid-hash.js
 *   # or:
 *   npm run backfill:nid-hash
 *
 *   # Live execution:
 *   DRY_RUN=false node dist/scripts/backfill-nid-hash.js
 *   # or:
 *   node dist/scripts/backfill-nid-hash.js --live
 *
 * Rules:
 *   - NIDs, names, emails, and any PII are NEVER logged.
 *   - Only aggregate counts and progress indicators are printed.
 *   - Live updates are executed in batches to prevent locking.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { getComputedNidHash } from '../common/utils/nid.util';

// Load environment files if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const isLive =
  process.env.DRY_RUN === 'false' || process.argv.includes('--live');
const DRY_RUN = !isLive;
const BATCH_SIZE = parseInt(process.env.BACKFILL_BATCH_SIZE ?? '100', 10);

function getHmacKey(): string {
  const key = process.env.NID_HMAC_KEY;
  if (!key) {
    console.error(
      '[backfill] FATAL: NID_HMAC_KEY environment variable is not configured. Aborting.',
    );
    process.exit(1);
  }
  return key;
}

export async function runBackfill(): Promise<{
  totalPending: number;
  updated: number;
  skippedNonNid: number;
  isDryRun: boolean;
}> {
  const hmacKey = getHmacKey();
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    // 1. Count pending rows where nid_hash is not set
    const totalPending = await prisma.customerRegistration.count({
      where: { nid_hash: null },
    });

    console.log(`[backfill] Records without nid_hash: ${totalPending}`);
    console.log(
      `[backfill] Mode: ${DRY_RUN ? 'DRY RUN (no database writes)' : 'LIVE EXECUTION'}`,
    );

    if (DRY_RUN) {
      console.log(
        '[backfill] Dry run completed. Pass --live or set DRY_RUN=false to apply updates.',
      );
      return { totalPending, updated: 0, skippedNonNid: 0, isDryRun: true };
    }

    if (totalPending === 0) {
      console.log(
        '[backfill] All CustomerRegistration records already have nid_hash set.',
      );
      return { totalPending: 0, updated: 0, skippedNonNid: 0, isDryRun: false };
    }

    // 2. Process records in ordered batches by ID cursor
    let updatedCount = 0;
    let skippedNonNidCount = 0;
    let lastId: string | undefined = undefined;
    let processedSoFar = 0;

    while (true) {
      const batch: Array<{ id: string; nid_passport_number: string | null }> =
        await prisma.customerRegistration.findMany({
          where: { nid_hash: null },
          select: { id: true, nid_passport_number: true },
          take: BATCH_SIZE,
          ...(lastId ? { skip: 1, cursor: { id: lastId } } : {}),
          orderBy: { id: 'asc' },
        });

      if (batch.length === 0) break;

      for (const row of batch) {
        lastId = row.id;
        processedSoFar++;

        const hash = getComputedNidHash(row.nid_passport_number, hmacKey);

        if (hash) {
          await prisma.customerRegistration.update({
            where: { id: row.id },
            data: {
              nid_hash: hash,
              nid_hash_version: 1,
            },
          });
          updatedCount++;
        } else {
          // Passport number, non-digit, or invalid length: remains nid_hash: null
          skippedNonNidCount++;
        }
      }

      console.log(
        `[backfill] Processed ${processedSoFar}/${totalPending} | Updated: ${updatedCount} | Skipped (non-NID/passport): ${skippedNonNidCount}`,
      );

      // Brief throttle to reduce DB load
      await new Promise((r) => setTimeout(r, 25));
    }

    console.log(
      `[backfill] Completed successfully. Total Updated: ${updatedCount} | Total Skipped (non-NID/passport): ${skippedNonNidCount}`,
    );

    return {
      totalPending,
      updated: updatedCount,
      skippedNonNid: skippedNonNidCount,
      isDryRun: false,
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Execute when invoked directly
if (require.main === module) {
  runBackfill().catch((err) => {
    console.error('[backfill] Fatal error:', err.message);
    process.exit(1);
  });
}
