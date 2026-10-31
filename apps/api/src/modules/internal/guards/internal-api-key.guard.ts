import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(InternalApiKeyGuard.name);
  /** SHA-256(INTERNAL_API_KEY) — fixed 32-byte digest for timingSafeEqual */
  private readonly expectedKeyDigest: Buffer | null;
  private readonly allowedIps: string[];

  constructor(private readonly config: ConfigService) {
    const rawKey = config.get<string>('INTERNAL_API_KEY');
    if (rawKey) {
      this.expectedKeyDigest = crypto
        .createHash('sha256')
        .update(rawKey)
        .digest();
    } else {
      this.expectedKeyDigest = null;
      this.logger.error(
        '[InternalApiKeyGuard] INTERNAL_API_KEY is not set — every request to internal endpoints will be rejected.',
      );
    }

    const ipsRaw = config.get<string>('INTERNAL_ALLOWED_IPS', '');
    this.allowedIps = ipsRaw
      ? ipsRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.expectedKeyDigest) {
      // Key not configured — fail closed, generic 401 (no hint for the caller)
      throw new UnauthorizedException('Unauthorized');
    }

    const req = context.switchToHttp().getRequest<Request>();

    // ── Optional IP allowlist ──────────────────────────────────────────────
    if (this.allowedIps.length > 0) {
      const ip = this.resolveIp(req);
      if (!this.allowedIps.includes(ip)) {
        this.logger.warn(
          `[InternalApiKeyGuard] Rejected request from unlisted IP: ${ip}`,
        );
        throw new UnauthorizedException('Unauthorized');
      }
    }

    // ── Bearer token validation (constant-time) ───────────────────────────
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Unauthorized');
    }

    const providedKey = authHeader.slice(7).trim();

    // Hash the provided key to the same fixed length so timingSafeEqual is
    // always called with equal-length buffers regardless of input length.
    const providedDigest = crypto
      .createHash('sha256')
      .update(providedKey)
      .digest();

    const valid = crypto.timingSafeEqual(this.expectedKeyDigest, providedDigest);
    if (!valid) {
      throw new UnauthorizedException('Unauthorized');
    }

    return true;
  }

  private resolveIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }
}
