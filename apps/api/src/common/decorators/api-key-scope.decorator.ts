import { SetMetadata } from '@nestjs/common';
import { API_KEY_SCOPE_KEY } from '../guards/api-key.guard';

/**
 * Declares the required API key scope for a route.
 * The ApiKeyGuard will reject requests whose key does not carry this scope
 * (unless the key has the wildcard scope '*').
 *
 * @example
 *   @ApiKeyScope('kyc:read')
 *   @Get('kyc/:userId')
 */
export const ApiKeyScope = (scope: string) => SetMetadata(API_KEY_SCOPE_KEY, scope);
