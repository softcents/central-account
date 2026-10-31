import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { AdminLoginDto, CreateAdminUserDto } from './dto/admin-login.dto';
import {
  AdminTicketReplyDto,
  ReviewKycDto,
  ReviewKybDto,
  UpdateTenantStatusDto,
  UpdateUserStatusDto,
} from './dto/admin-review.dto';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminRoles } from './decorators/admin-roles.decorator';
import { AdminRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // -------------------------------------------------------------
  // AUTH
  // -------------------------------------------------------------

  @Public()
  @Post('auth/login')
  async login(
    @Body() dto: AdminLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await this.adminService.login(dto, ip, userAgent);

    // Set cookie for convenience
    res.cookie('ci_admin_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @UseGuards(AdminAuthGuard)
  @Get('auth/me')
  async me(@CurrentAdmin('id') adminId: string) {
    return this.adminService.getAdminProfile(adminId);
  }

  @UseGuards(AdminAuthGuard)
  @Post('auth/logout')
  async logout(
    @CurrentAdmin('id') adminId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.replace('Bearer ', '') || req.cookies?.['ci_admin_token'] || '';
    res.clearCookie('ci_admin_token');
    return this.adminService.logout(adminId, token);
  }

  // -------------------------------------------------------------
  // DASHBOARD
  // -------------------------------------------------------------

  @UseGuards(AdminAuthGuard)
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // -------------------------------------------------------------
  // USERS
  // -------------------------------------------------------------

  @UseGuards(AdminAuthGuard)
  @Get('users')
  async getUsers(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUsers(
      search,
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @UseGuards(AdminAuthGuard)
  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @UseGuards(AdminAuthGuard)
  @Post('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentAdmin('id') adminId: string,
  ) {
    return this.adminService.updateUserStatus(id, dto, adminId);
  }

  // -------------------------------------------------------------
  // USER IMPERSONATION
  // -------------------------------------------------------------

  @UseGuards(AdminAuthGuard)
  @Post('users/:id/impersonate')
  async impersonateUser(
    @Param('id') userId: string,
    @CurrentAdmin('id') adminId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.adminService.impersonateUser(adminId, userId, ip, userAgent);
  }

  @UseGuards(AdminAuthGuard)
  @Post('users/:id/impersonate/leave')
  async leaveImpersonation(
    @Param('id') userId: string,
    @CurrentAdmin('id') adminId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.adminService.leaveImpersonation(adminId, userId, ip);
  }

  @UseGuards(AdminAuthGuard)
  @Post('impersonate/leave')
  async leaveImpersonationGeneral(
    @CurrentAdmin('id') adminId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.adminService.leaveImpersonation(adminId, undefined, ip);
  }

  // -------------------------------------------------------------
  // KYC REVIEW
  // -------------------------------------------------------------

  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.KYC_REVIEWER, AdminRole.IDENTITY_ADMIN)
  @Get('kyc/queue')
  async getKycQueue(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getKycQueue(
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @UseGuards(AdminAuthGuard)
  @Get('kyc/documents/:documentId/file/:side')
  async getDocumentFile(
    @Param('documentId') documentId: string,
    @Param('side') side: string,
    @Res() res: Response,
  ) {
    if (side !== 'front' && side !== 'back') {
      return res.status(400).json({ message: 'Side must be "front" or "back"' });
    }

    const { buffer, mimeType, fileName } = await this.adminService.getDocumentFile(
      documentId,
      side as 'front' | 'back',
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'private, no-store',
    });

    return res.send(buffer);
  }

  @UseGuards(AdminAuthGuard)
  @Get('kyc/:id')
  async getKycDetail(@Param('id') id: string) {
    return this.adminService.getKycDetail(id);
  }

  @UseGuards(AdminAuthGuard)
  @Get('kyc/:verificationId/face/:type')
  async getFaceFile(
    @Param('verificationId') verificationId: string,
    @Param('type') type: string,
    @Res() res: Response,
  ) {
    if (type !== 'portrait' && type !== 'live') {
      return res.status(400).json({ message: 'Type must be "portrait" or "live"' });
    }

    const { buffer, mimeType, fileName } = await this.adminService.getFaceFile(
      verificationId,
      type as 'portrait' | 'live',
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'private, no-store',
    });

    return res.send(buffer);
  }

  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.KYC_REVIEWER, AdminRole.IDENTITY_ADMIN)
  @Post('kyc/:id/review')
  async reviewKyc(
    @Param('id') id: string,
    @Body() dto: ReviewKycDto,
    @CurrentAdmin('id') adminId: string,
  ) {
    return this.adminService.reviewKyc(id, dto, adminId);
  }

  // -------------------------------------------------------------
  // KYB REVIEW
  // -------------------------------------------------------------

  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.KYB_REVIEWER, AdminRole.IDENTITY_ADMIN)
  @Get('kyb/queue')
  async getKybQueue(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getKybQueue(
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @UseGuards(AdminAuthGuard)
  @Get('kyb/:id')
  async getKybDetail(@Param('id') id: string) {
    return this.adminService.getKybDetail(id);
  }

  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.KYB_REVIEWER, AdminRole.IDENTITY_ADMIN)
  @Post('kyb/:id/review')
  async reviewKyb(
    @Param('id') id: string,
    @Body() dto: ReviewKybDto,
    @CurrentAdmin('id') adminId: string,
  ) {
    return this.adminService.reviewKyb(id, dto, adminId);
  }

  // -------------------------------------------------------------
  // MULTI-TENANT SAAS
  // -------------------------------------------------------------

  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SAAS_ADMIN)
  @Get('tenants')
  async getTenants(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getTenants(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @UseGuards(AdminAuthGuard)
  @Get('tenants/:id')
  async getTenantDetail(@Param('id') id: string) {
    return this.adminService.getTenantDetail(id);
  }

  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SAAS_ADMIN)
  @Post('tenants/:id/status')
  async updateTenantStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTenantStatusDto,
    @CurrentAdmin('id') adminId: string,
  ) {
    return this.adminService.updateTenantStatus(id, dto, adminId);
  }

  // -------------------------------------------------------------
  // BILLING & INVOICES
  // -------------------------------------------------------------

  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.BILLING_ADMIN, AdminRole.SAAS_ADMIN)
  @Get('billing/overview')
  async getBillingOverview() {
    return this.adminService.getBillingOverview();
  }

  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.BILLING_ADMIN)
  @Post('billing/invoices/:id/pay')
  async markInvoicePaid(
    @Param('id') invoiceId: string,
    @CurrentAdmin('id') adminId: string,
  ) {
    return this.adminService.markInvoicePaid(invoiceId, adminId);
  }

  // -------------------------------------------------------------
  // SUPPORT TICKETS
  // -------------------------------------------------------------

  @UseGuards(AdminAuthGuard)
  @Get('support/tickets')
  async getSupportTickets(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getSupportTickets(
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @UseGuards(AdminAuthGuard)
  @Get('support/tickets/:id')
  async getSupportTicketDetail(@Param('id') id: string) {
    return this.adminService.getSupportTicketDetail(id);
  }

  @UseGuards(AdminAuthGuard)
  @Post('support/tickets/:id/reply')
  async replySupportTicket(
    @Param('id') id: string,
    @Body() dto: AdminTicketReplyDto,
    @CurrentAdmin('id') adminId: string,
  ) {
    return this.adminService.replySupportTicket(id, dto, adminId);
  }

  // -------------------------------------------------------------
  // OAUTH APPLICATIONS
  // -------------------------------------------------------------

  @UseGuards(AdminAuthGuard)
  @Get('oauth/clients')
  async getOAuthClients() {
    return this.adminService.getOAuthClients();
  }

  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SECURITY_ADMIN)
  @Post('oauth/clients/:id/status')
  async updateOAuthClientStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED',
    @CurrentAdmin('id') adminId: string,
  ) {
    return this.adminService.updateOAuthClientStatus(id, status, adminId);
  }

  // -------------------------------------------------------------
  // AUDIT LOGS
  // -------------------------------------------------------------

  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR, AdminRole.SECURITY_ADMIN)
  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  // -------------------------------------------------------------
  // ADMIN TEAM MANAGEMENT
  // -------------------------------------------------------------

  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Get('team')
  async getAdminTeam() {
    return this.adminService.getAdminTeam();
  }

  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Post('team')
  async createAdminUser(
    @Body() dto: CreateAdminUserDto,
    @CurrentAdmin('id') adminId: string,
  ) {
    return this.adminService.createAdminUser(dto, adminId);
  }

  // -------------------------------------------------------------
  // BACKGROUND QUEUES & BULLMQ TELEMETRY
  // -------------------------------------------------------------

  @UseGuards(AdminAuthGuard)
  @Get('queues')
  async getQueueMetrics() {
    return this.adminService.getQueueMetrics();
  }

  @UseGuards(AdminAuthGuard)
  @Get('queues/:queueName/failed')
  async getFailedJobs(@Param('queueName') queueName: string) {
    return this.adminService.getFailedJobs(queueName);
  }

  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.SECURITY_ADMIN)
  @Post('queues/:queueName/retry/:jobId')
  async retryFailedJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
    @CurrentAdmin('id') adminId: string,
  ) {
    return this.adminService.retryFailedJob(adminId, queueName, jobId);
  }

  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Post('queues/:queueName/clean')
  async cleanQueue(
    @Param('queueName') queueName: string,
    @CurrentAdmin('id') adminId: string,
  ) {
    return this.adminService.cleanQueue(adminId, queueName);
  }
}
