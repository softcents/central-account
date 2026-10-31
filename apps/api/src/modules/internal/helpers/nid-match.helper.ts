import { Prisma } from '@prisma/client';

/**
 * Builds the exact Prisma `where` clause used to match an active, verified user
 * by hashed NID and Date of Birth range.
 *
 * A record matches only when ALL of the following hold:
 *   1. nid_hash matches the HMAC-SHA256 of the normalized NID.
 *   2. date_of_birth falls within the UTC day boundaries of the given YYYY-MM-DD.
 *   3. user.status = 'ACTIVE' (suspended / pending users never match).
 *   4. OR-branch:
 *      a. KYC path — user has at least one IdentityVerification with status = 'VERIFIED'.
 *      b. KYB path — user is an OWNER or ADMIN of a Business whose status = 'VERIFIED'.
 *
 * This function is the single source of truth for both `POST /api/internal/nid-check`
 * and `POST /api/internal/nid-lookup`, ensuring they can never drift apart.
 */
export function buildNidMatchWhere(
  nidHash: string,
  dob: string,
): Prisma.CustomerRegistrationWhereInput {
  const dobStart = new Date(`${dob}T00:00:00.000Z`);
  const dobEnd = new Date(dobStart.getTime() + 86_400_000); // +1 day (UTC)

  return {
    nid_hash: nidHash,
    date_of_birth: { gte: dobStart, lt: dobEnd },
    user: {
      status: 'ACTIVE',
      OR: [
        // ── KYC branch ─────────────────────────────────────────────
        {
          identity_verifications: {
            some: { status: 'VERIFIED' },
          },
        },
        // ── KYB branch ─────────────────────────────────────────────
        {
          business_memberships: {
            some: {
              role: { in: ['OWNER', 'ADMIN'] },
              business: { status: 'VERIFIED' },
            },
          },
        },
      ],
    },
  };
}
