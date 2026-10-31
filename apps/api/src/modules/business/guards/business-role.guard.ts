import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';

export const BUSINESS_ROLES_KEY = 'business_roles';
export const RequireBusinessRoles = (...roles: string[]) => SetMetadata(BUSINESS_ROLES_KEY, roles);

@Injectable()
export class BusinessRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(BUSINESS_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const businessId = request.params?.id || request.body?.businessId;

    if (!userId || !businessId) {
      throw new ForbiddenException('User or business identifier missing');
    }

    const membership = await this.prisma.businessUser.findUnique({
      where: {
        business_id_user_id: {
          business_id: businessId,
          user_id: userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this business entity');
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredRoles.join(', ')}. Current: ${membership.role}`,
      );
    }

    // Attach membership to request for downstream access
    request.businessMembership = membership;
    return true;
  }
}
