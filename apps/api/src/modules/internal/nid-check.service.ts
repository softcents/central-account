import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import { normalizeNid, computeNidHmac } from '../../common/utils/nid.util';
import { buildNidMatchWhere } from './helpers/nid-match.helper';

export interface NidCheckResult {
  match: boolean;
}

@Injectable()
export class NidCheckService implements OnModuleInit {
  private readonly logger = new Logger(NidCheckService.name);

  /** Set to true only when both required env keys are present. */
  private enabled = false;
  private hmacKey: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) { }

  onModuleInit(): void {
    const apiKey = this.config.get<string>('INTERNAL_API_KEY');
    const hmacKey = this.config.get<string>('NID_HMAC_KEY');

    if (!apiKey) {
      this.logger.error(
        '[NidCheck] CRITICAL: INTERNAL_API_KEY is not configured — ' +
        'POST /api/internal/nid-check will reject all requests.',
      );
    }
    if (!hmacKey) {
      this.logger.error(
        '[NidCheck] CRITICAL: NID_HMAC_KEY is not configured — ' +
        'POST /api/internal/nid-check will always return { match: false }.',
      );
    }

    if (apiKey && hmacKey) {
      this.hmacKey = hmacKey;
      this.enabled = true;
      this.logger.log('[NidCheck] Endpoint is enabled and ready.');
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async check(
    normalizedNid: string,
    dob: string,
    callerIp: string,
  ): Promise<NidCheckResult> {
    const masked = this.maskNid(normalizedNid);

    if (!this.enabled) {
      // Fail closed — NID_HMAC_KEY missing; do dummy work to avoid fast-path timing leak
      await this.dummyWork(normalizedNid);
      this.logger.error(
        `[NidCheck] ${new Date().toISOString()} | ip=${callerIp} | nid=${masked} | match=false [DISABLED — missing env key]`,
      );
      return { match: false };
    }

    const normalized = normalizeNid(normalizedNid);
    if (!normalized) {
      await this.dummyWork(normalizedNid);
      this.logger.warn(
        `[NidCheck] ${new Date().toISOString()} | ip=${callerIp} | nid=${masked} | match=false [INVALID NID FORMAT]`,
      );
      return { match: false };
    }

    const nidHash = computeNidHmac(normalized, this.hmacKey!);

    // Single ORM query using shared where clause helper — no raw SQL, no plaintext NID touches the DB.
    const record = await this.prisma.customerRegistration.findFirst({
      where: buildNidMatchWhere(nidHash, dob),
      select: { id: true }, // never return NID, user_id, name, email, status
    });

    const match = record !== null;

    // Timing equalisation: when no record found, perform equivalent CPU/IO work
    // so the caller cannot distinguish "NID unknown" from "DOB mismatch".
    if (!match) {
      await this.dummyWork(normalized);
    }

    this.logger.log(
      `[NidCheck] ${new Date().toISOString()} | ip=${callerIp} | nid=${masked} | match=${match}`,
    );

    return { match };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private computeHmac(normalizedNid: string): string {
    return computeNidHmac(normalizedNid, this.hmacKey!);
  }

  /**
   * Performs work equivalent to a real lookup so that response latency
   * does not reveal whether a NID exists in the database.
   */
  private async dummyWork(normalizedNid: string): Promise<void> {
    // Same HMAC computation as a real call (CPU equalisation)
    if (this.hmacKey) {
      crypto.createHmac('sha256', this.hmacKey).update(normalizedNid).digest('hex');
    }
    // Brief jitter to approximate a DB round-trip (~5–15 ms)
    await new Promise<void>((resolve) =>
      setTimeout(resolve, 5 + Math.random() * 10),
    );
  }

  private maskNid(nid: string): string {
    if (nid.length < 4) return '**';
    return `${nid.slice(0, 2)}${'*'.repeat(nid.length - 4)}${nid.slice(-2)}`;
  }
}
