import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import {
  CreateApiKeyDto,
  CreateTenantDto,
  InviteMemberDto,
  UpdateBrandingDto,
  ConfigureProviderDto,
  CreateCustomerDto,
  CustomerDecisionDto,
  CreateCustomDomainDto,
} from './dto/tenant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}


  @Post()
  async createTenant(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTenantDto,
  ) {
    return this.tenantService.createTenant(userId, dto);
  }

  @Get()
  async getUserTenants(@CurrentUser('id') userId: string) {
    return this.tenantService.getUserTenants(userId);
  }

  // Phase 3: Public Custom Domain Resolver
  @Public()
  @Get('lookup/domain')
  async resolveCustomDomain(@Query('domain') domain: string) {
    return this.tenantService.resolveTenantByDomain(domain);
  }

  @Get(':id')
  async getTenantById(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tenantService.getTenantById(tenantId, userId);
  }

  @Patch(':id/branding')
  async updateBranding(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBrandingDto,
  ) {
    return this.tenantService.updateBranding(tenantId, userId, dto);
  }

  @Post(':id/members/invite')
  async inviteMember(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.tenantService.inviteMember(tenantId, userId, dto);
  }

  @Post(':id/members/:memberId/resend')
  async resendInvite(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.tenantService.resendInvite(tenantId, userId, memberId);
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.tenantService.removeMember(tenantId, userId, memberId);
  }

  @Post(':id/api-keys')
  async createApiKey(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.tenantService.createApiKey(tenantId, userId, dto);
  }

  @Get(':id/api-keys')
  async getApiKeys(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tenantService.getApiKeys(tenantId, userId);
  }

  @Delete(':id/api-keys/:keyId')
  async revokeApiKey(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('keyId') keyId: string,
  ) {
    return this.tenantService.revokeApiKey(tenantId, userId, keyId);
  }

  @Get(':id/usage')
  async getUsage(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tenantService.getUsage(tenantId, userId);
  }

  // -------------------------------------------------------------
  // PHASE 2: TENANT PROVIDER CONFIGURATION (EXTERNAL API KEYS)
  // -------------------------------------------------------------

  @Post(':id/providers')
  async configureProvider(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ConfigureProviderDto,
  ) {
    return this.tenantService.configureProvider(tenantId, userId, dto);
  }

  @Get(':id/providers')
  async getProviderConfigs(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tenantService.getProviderConfigs(tenantId, userId);
  }

  @Delete(':id/providers/:providerId')
  async deleteProviderConfig(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('providerId') providerId: string,
  ) {
    return this.tenantService.deleteProviderConfig(tenantId, userId, providerId);
  }

  @Post(':id/providers/:providerId/test')
  async testProviderConnection(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('providerId') providerId: string,
  ) {
    return this.tenantService.testProviderConnection(tenantId, userId, providerId);
  }

  // -------------------------------------------------------------
  // PHASE 2: TENANT CUSTOMER MANAGEMENT (LAYER 2 KYC/KYB)
  // -------------------------------------------------------------

  @Post(':id/customers')
  async createCustomer(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.tenantService.createCustomer(tenantId, userId, dto);
  }

  @Get(':id/customers')
  async getCustomers(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tenantService.getCustomers(
      tenantId,
      userId,
      search,
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id/customers/:customerId')
  async getCustomerById(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('customerId') customerId: string,
  ) {
    return this.tenantService.getCustomerById(tenantId, customerId, userId);
  }

  @Get(':id/verifications')
  async getTenantVerifications(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tenantService.getTenantVerifications(
      tenantId,
      userId,
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id/verifications/:verificationId')
  async getTenantVerificationDetail(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('verificationId') verificationId: string,
  ) {
    return this.tenantService.getTenantVerificationDetail(tenantId, verificationId, userId);
  }

  @Post(':id/verifications/:verificationId/decision')
  async recordTenantVerificationDecision(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('verificationId') verificationId: string,
    @Body() dto: CustomerDecisionDto,
  ) {
    return this.tenantService.recordTenantVerificationDecision(
      tenantId,
      verificationId,
      userId,
      dto,
    );
  }

  @Get(':id/reports/summary')
  async getTenantReportSummary(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tenantService.getTenantReportSummary(tenantId, userId);
  }

  // -------------------------------------------------------------
  // PHASE 3: CUSTOM DOMAIN MANAGEMENT
  // -------------------------------------------------------------

  @Post(':id/domains')
  async createCustomDomain(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCustomDomainDto,
  ) {
    return this.tenantService.createCustomDomain(tenantId, userId, dto);
  }

  @Get(':id/domains')
  async getCustomDomains(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tenantService.getCustomDomains(tenantId, userId);
  }

  @Get(':id/domains/:domainId')
  async getCustomDomainById(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('domainId') domainId: string,
  ) {
    return this.tenantService.getCustomDomainById(tenantId, domainId, userId);
  }

  @Post(':id/domains/:domainId/verify')
  async verifyCustomDomain(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('domainId') domainId: string,
  ) {
    return this.tenantService.verifyCustomDomain(tenantId, domainId, userId);
  }

  @Post(':id/domains/:domainId/primary')
  async setPrimaryCustomDomain(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('domainId') domainId: string,
  ) {
    return this.tenantService.setPrimaryCustomDomain(tenantId, domainId, userId);
  }

  @Delete(':id/domains/:domainId')
  async deleteCustomDomain(
    @Param('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('domainId') domainId: string,
  ) {
    return this.tenantService.deleteCustomDomain(tenantId, domainId, userId);
  }
}

