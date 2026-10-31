import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface TenantContext {
  tenantId: string;
  role: string;
  permissions: string[];
}

export const CurrentTenant = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantCtx: TenantContext | undefined = request.tenantContext;
    if (!tenantCtx) {
      return null;
    }
    return data ? tenantCtx[data] : tenantCtx;
  },
);
