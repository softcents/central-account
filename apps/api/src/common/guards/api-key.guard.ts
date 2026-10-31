import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

export const API_KEY_SCOPE_KEY = 'api_key_scope';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract Bearer token from Authorization header
    const authHeader: string | undefined = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing Authorization header. Use: Authorization: Bearer ci_live_<your_api_key>',
      );
    }

    const rawKey = authHeader.slice(7).trim();

    // Validate key format
    if (!rawKey.startsWith('ci_live_')) {
      throw new UnauthorizedException('Invalid API key format. Key must start with ci_live_');
    }

    // Hash the key for DB lookup (we never store plaintext)
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await (this.prisma as any).tenantApiKey.findUnique({
      where: { key_hash: keyHash },
      include: {
        tenant: {
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              include: { plan: true },
              take: 1,
              orderBy: { created_at: 'desc' },
            },
          },
        },
      },
    });

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (apiKey.is_revoked) {
      throw new UnauthorizedException('This API key has been revoked');
    }

    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      throw new UnauthorizedException('This API key has expired');
    }

    // IP allowlist check (skip if list is empty)
    if (apiKey.ip_allowlist && apiKey.ip_allowlist.length > 0) {
      const clientIp =
        request.ip ||
        (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        request.socket?.remoteAddress;
      if (!apiKey.ip_allowlist.includes(clientIp)) {
        throw new ForbiddenException(`Request from IP ${clientIp} is not in this key's allowlist`);
      }
    }

    // Scope enforcement
    const requiredScope = this.reflector.getAllAndOverride<string>(API_KEY_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredScope && !apiKey.scopes.includes(requiredScope) && !apiKey.scopes.includes('*')) {
      throw new ForbiddenException(
        `This API key does not have the required scope: ${requiredScope}`,
      );
    }

    // Update last_used_at (fire-and-forget — don't block the request)
    (this.prisma as any).tenantApiKey
      .update({ where: { id: apiKey.id }, data: { last_used_at: new Date() } })
      .catch(() => {});

    // Stamp resolved context onto the request for controllers
    request.apiKeyContext = {
      apiKeyId: apiKey.id,
      tenantId: apiKey.tenant_id,
      tenant: apiKey.tenant,
      scopes: apiKey.scopes,
    };

    return true;
  }
}
