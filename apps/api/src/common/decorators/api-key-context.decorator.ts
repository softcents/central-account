import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the resolved API key context from the request.
 * The ApiKeyGuard populates request.apiKeyContext before the controller runs.
 *
 * @example
 *   async myHandler(@ApiKeyContext() ctx: ApiKeyCtx) { ... }
 */
export interface ApiKeyCtx {
  apiKeyId: string;
  tenantId: string;
  tenant: any;
  scopes: string[];
}

export const ApiKeyContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ApiKeyCtx => {
    const request = ctx.switchToHttp().getRequest();
    return request.apiKeyContext;
  },
);
