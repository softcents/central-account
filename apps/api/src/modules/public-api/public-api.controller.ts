import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PublicApiService } from './public-api.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { ApiKeyScope } from '../../common/decorators/api-key-scope.decorator';
import { ApiKeyContext, ApiKeyCtx } from '../../common/decorators/api-key-context.decorator';

/**
 * Public API — v1
 *
 * All routes are authenticated with a Bearer API key (ci_live_*).
 * CSRF guard is bypassed because API key clients are server-to-server.
 * Throttler still applies (100 req/min per tenant).
 *
 * Scopes enforced per route:
 *   kyc:read  — read KYC identity verification data
 *   kyb:read  — read KYB business verification data
 *   account:read — read tenant plan / account info
 */
@Controller('v1')
@UseGuards(ApiKeyGuard)
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  // -----------------------------------------------------------------------
  // GET /api/v1/kyc/:userId
  // -----------------------------------------------------------------------
  /**
   * Retrieve the full verified KYC record for a user.
   * :userId can be the Central Account user UUID or the user's email address.
   *
   * Scope required: kyc:read
   */
  @Get('kyc/:userId')
  @ApiKeyScope('kyc:read')
  @HttpCode(HttpStatus.OK)
  async getKycResult(
    @Param('userId') userId: string,
    @ApiKeyContext() ctx: ApiKeyCtx,
  ) {
    const data = await this.publicApiService.getKycResult(ctx.tenantId, userId);
    return {
      success: true,
      requestId: ctx.apiKeyId,
      data,
    };
  }

  // -----------------------------------------------------------------------
  // GET /api/v1/kyc/lookup?email=user@example.com
  // -----------------------------------------------------------------------
  /**
   * Lightweight KYC status check by email.
   * Returns verified: true/false + status string without the full data payload.
   *
   * Scope required: kyc:read
   */
  @Get('kyc/lookup')
  @ApiKeyScope('kyc:read')
  @HttpCode(HttpStatus.OK)
  async lookupKycByEmail(
    @Query('email') email: string,
    @ApiKeyContext() ctx: ApiKeyCtx,
  ) {
    const data = await this.publicApiService.lookupUserKycStatus(ctx.tenantId, email);
    return {
      success: true,
      requestId: ctx.apiKeyId,
      data,
    };
  }

  // -----------------------------------------------------------------------
  // GET /api/v1/kyb/:businessId
  // -----------------------------------------------------------------------
  /**
   * Retrieve the full verified KYB record for a business entity.
   * :businessId is the Central Account business UUID.
   *
   * Scope required: kyb:read
   */
  @Get('kyb/:businessId')
  @ApiKeyScope('kyb:read')
  @HttpCode(HttpStatus.OK)
  async getKybResult(
    @Param('businessId') businessId: string,
    @ApiKeyContext() ctx: ApiKeyCtx,
  ) {
    const data = await this.publicApiService.getKybResult(ctx.tenantId, businessId);
    return {
      success: true,
      requestId: ctx.apiKeyId,
      data,
    };
  }

  // -----------------------------------------------------------------------
  // GET /api/v1/account
  // -----------------------------------------------------------------------
  /**
   * Returns the tenant's plan name, API limits, and status.
   * Useful for clients to check their own quota before making bulk calls.
   *
   * Scope required: account:read
   */
  @Get('account')
  @ApiKeyScope('account:read')
  @HttpCode(HttpStatus.OK)
  async getAccount(@ApiKeyContext() ctx: ApiKeyCtx) {
    const data = await this.publicApiService.getTenantAccountInfo(ctx.tenantId);
    return {
      success: true,
      requestId: ctx.apiKeyId,
      data,
    };
  }
}
