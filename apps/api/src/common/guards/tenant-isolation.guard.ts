import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { TENANT_ROLES_KEY } from '../decorators/tenant-roles.decorator';

@Injectable()
export class TenantIsolationGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Resolve Target Tenant ID from params, headers, query, or body
    const tenantId: string | undefined =
      request.params?.tenantId ||
      request.params?.id ||
      request.headers?.['x-tenant-id'] ||
      request.query?.tenantId ||
      request.body?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant identification is required for this operation');
    }

    // 2. Allow Platform Super Admin bypass if admin authenticated
    if (request.admin?.role === 'SUPER_ADMIN') {
      request.tenantContext = {
        tenantId,
        role: 'SUPER_ADMIN',
        permissions: ['*'],
      };
      return true;
    }

    // 3. User authentication is required
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required to access tenant resources');
    }

    // 4. Verify caller's membership in the target tenant
    const membership = await (this.prisma as any).tenantMember.findUnique({
      where: {
        tenant_id_user_id: {
          tenant_id: tenantId,
          user_id: userId,
        },
      },
      include: {
        tenant: {
          select: { id: true, status: true },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Cross-tenant access forbidden. You are not a member of this tenant.');
    }

    if (membership.tenant.status === 'SUSPENDED') {
      throw new ForbiddenException('Tenant access suspended. Please contact organization owner or billing.');
    }

    // 5. Enforce role requirements if specified by @RequireTenantRoles
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      TENANT_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = membership.role;
      const isOwner = userRole === 'OWNER';
      const hasRequiredRole = requiredRoles.includes(userRole);

      if (!isOwner && !hasRequiredRole) {
        throw new ForbiddenException(
          `Insufficient tenant role. Required: ${requiredRoles.join(' or ')}. Your role: ${userRole}`,
        );
      }
    }

    // 6. Stamp tenant context onto request
    request.tenantContext = {
      tenantId: membership.tenant_id,
      role: membership.role,
      permissions: membership.permissions,
    };

    return true;
  }
}
