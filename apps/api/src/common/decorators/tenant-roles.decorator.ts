import { SetMetadata } from '@nestjs/common';
import { TenantRole } from '@prisma/client';

export const TENANT_ROLES_KEY = 'tenant_roles';
export const RequireTenantRoles = (...roles: (TenantRole | string)[]) =>
  SetMetadata(TENANT_ROLES_KEY, roles);
