import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '@prisma/client';
import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(
      ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { admin } = context.switchToHttp().getRequest();
    if (!admin) {
      throw new ForbiddenException('Admin identity required');
    }

    // SUPER_ADMIN has god-mode across all roles
    if (admin.role === AdminRole.SUPER_ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(admin.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient privileges. Required role: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
