import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Safe read-only HTTP methods are exempt
    if (this.safeMethods.has(request.method.toUpperCase())) {
      return true;
    }

    // Check for CSRF prevention headers
    const customHeader =
      request.headers['x-requested-with'] ||
      request.headers['x-csrf-protection'] ||
      request.headers['authorization'];

    // In non-browser (e.g. CLI/tests) or custom-header verified requests, CSRF is prevented
    if (customHeader) {
      return true;
    }

    // Origin / Referer validation against allowed domains
    const origin = request.headers['origin'] as string;
    const referer = request.headers['referer'] as string;
    const allowedOrigin = process.env.FRONTEND_URL || 'https://account.softcents.com';

    if (origin && origin.startsWith(allowedOrigin)) {
      return true;
    }

    if (referer && referer.startsWith(allowedOrigin)) {
      return true;
    }

    // Allow requests in test environments if origin header is omitted
    if (process.env.NODE_ENV === 'test') {
      return true;
    }

    throw new ForbiddenException('CSRF check failed: Missing security headers or invalid origin');
  }
}
