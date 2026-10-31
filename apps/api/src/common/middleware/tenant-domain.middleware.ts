import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

export interface CustomDomainContext {
  tenantId: string;
  domain: string;
  isPrimary: boolean;
  sslStatus: string;
}

declare global {
  namespace Express {
    interface Request {
      customDomainContext?: CustomDomainContext;
    }
  }
}

@Injectable()
export class TenantDomainMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Resolve host from x-custom-domain header, x-forwarded-host, or Host header
      const rawHost =
        (req.headers['x-custom-domain'] as string) ||
        (req.headers['x-forwarded-host'] as string) ||
        (req.headers['host'] as string);

      if (!rawHost) {
        return next();
      }

      // Strip port if present (e.g. auth.company.com:4000 -> auth.company.com)
      const hostname = rawHost.split(':')[0].trim().toLowerCase();

      // Skip base platform hosts, internal IPs, and localhost
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('.localhost') ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal')
      ) {
        return next();
      }

      // 2. Query verified custom domain record
      const customDomain = await (this.prisma as any).customDomain.findFirst({
        where: {
          domain: hostname,
          status: 'VERIFIED',
        },
        select: {
          id: true,
          tenant_id: true,
          domain: true,
          is_primary: true,
          ssl_status: true,
        },
      });

      if (customDomain) {
        // Automatically inject tenant ID header if not already explicitly provided
        if (!req.headers['x-tenant-id']) {
          req.headers['x-tenant-id'] = customDomain.tenant_id;
        }

        req.customDomainContext = {
          tenantId: customDomain.tenant_id,
          domain: customDomain.domain,
          isPrimary: customDomain.is_primary,
          sslStatus: customDomain.ssl_status,
        };
      }
    } catch (err) {
      // Non-blocking: fail open so request pipeline is never halted by domain resolution lookup
    }

    next();
  }
}
