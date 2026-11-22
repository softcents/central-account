import { Controller, Get, Post, Body, Query, Headers, Param, Res, HttpStatus } from '@nestjs/common';
import { WhmcsService } from './whmcs.service';
import { WhmcsCronService } from './whmcs-cron.service';

@Controller('whmcs')
export class WhmcsController {
  constructor(
    private readonly whmcs: WhmcsService,
    private readonly whmcsCron: WhmcsCronService,
  ) {}

  @Post('cron/run')
  async runCron() {
    return this.whmcsCron.runAutomationCycle();
  }

  @Post('cart/checkout')
  async createCartOrder(@Body() body: any) {
    return this.whmcs.createOrder(body);
  }

  @Post('services/:id/provision')
  async provisionServiceEndpoint(@Param('id') id: string) {
    return this.whmcs.provisionService(id);
  }

  @Get('summary')
  getSummary() {
    return this.whmcs.getSummary();
  }

  @Get('products/groups')
  getProductGroups() {
    return this.whmcs.getProductGroups();
  }

  @Get('products')
  getProducts(@Query('gid') gid?: string) {
    return this.whmcs.getProducts(gid);
  }

  @Get('client/:id')
  getClient(@Param('id') id: string) {
    return this.whmcs.getClient(id);
  }

  @Get('client/:id/services')
  getClientServices(@Param('id') id: string) {
    return this.whmcs.getClientServices(id);
  }

  // GATEWAYS: PipraPay
  @Post('gateways/piprapay/checkout')
  async piprapayCheckout(@Body() body: any) {
    return this.whmcs.piprapay.createCharge(body);
  }

  @Post('gateways/piprapay/callback')
  async piprapayCallback(@Body() body: any, @Headers() headers: any) {
    const invoiceId = body?.metadata?.invoiceid;
    const ppId = body?.pp_id;
    const amount = Number(body?.amount || 0);

    if (invoiceId && ppId) {
      await this.whmcs.applyPayment(invoiceId, ppId, amount, 'piprapay');
      return { status: 'success', message: 'Invoice paid successfully via PipraPay' };
    }
    return { status: 'ignored' };
  }

  // GATEWAYS: UddoktaPay
  @Post('gateways/uddoktapay/checkout')
  async uddoktapayCheckout(@Body() body: any) {
    return this.whmcs.uddoktapay.createCharge(body);
  }

  // GATEWAYS: Reseller Wallet Credit
  @Post('gateways/reseller/deduct')
  async deductWalletBalance(@Body() body: { clientId: string | number; invoiceId: string | number; amount: number }) {
    const client = this.whmcs.getClient(body.clientId);
    const balance = Number(client?.credit || 10000);
    const res = await this.whmcs.resellerGateway.processPayment({
      clientId: body.clientId,
      amount: body.amount,
      currentBalance: balance,
      invoiceId: body.invoiceId,
    });
    if (res.success) {
      if (client) client.credit = String(res.newBalance);
      await this.whmcs.applyPayment(body.invoiceId, `WALLET-${Date.now()}`, body.amount, 'reseller');
      return { success: true, message: 'Paid with wallet balance', newBalance: res.newBalance };
    }
    return { success: false, message: res.error || 'Failed to deduct wallet' };
  }

  @Post('gateways/uddoktapay/webhook')
  async uddoktapayWebhook(@Body() body: any, @Headers() headers: any) {
    const invoiceId = body?.metadata?.invoice_id;
    const trxId = body?.transaction_id || body?.invoice_id;
    const amount = Number(body?.amount || 0);

    if (invoiceId && trxId && body?.status === 'COMPLETED') {
      await this.whmcs.applyPayment(invoiceId, trxId, amount, 'uddoktapay');
      return { status: 'success', message: 'Invoice paid successfully via UddoktaPay' };
    }
    return { status: 'received' };
  }

  // SERVERS: Softcents PBX
  @Post('servers/softcentspbx/extension-password')
  async updateExtensionPassword(@Body() body: { domain: string; extension: string; newPassword: string }) {
    return this.whmcs.pbxServer.updateExtensionPassword(body);
  }

  @Get('servers/softcentspbx/sso')
  async getPbxSso(@Query('domain') domain: string, @Query('adminUser') adminUser: string) {
    return this.whmcs.pbxServer.generateSsoToken({ domain, adminUser });
  }

  @Post('servers/softcentspbx/unblock-ip')
  async unblockPbxIp(@Body() body: { domain: string; clientIp: string }) {
    return this.whmcs.pbxServer.unblockIp(body);
  }

  // SERVERS: cPanel
  @Get('servers/cpanel/sso')
  async getCpanelSso(@Query('username') username: string, @Query('host') host?: string) {
    return this.whmcs.cpanelServer.generateSsoUrl(username, host ? { host, user: 'sgsoft', apiToken: '' } : undefined);
  }

  @Post('servers/cpanel/change-password')
  async changeCpanelPassword(@Body() body: { username: string; newPass: string }) {
    return this.whmcs.cpanelServer.changePassword(body.username, body.newPass);
  }

  // SERVERS: BHPanel (cPanel Alternative BDIX Hosting)
  @Get('servers/bhpanel/sso')
  async getBhpanelSso(
    @Query('username') username: string,
    @Query('domain') domain: string,
    @Query('to') to?: string,
  ) {
    return this.whmcs.bhpanelServer.generateSsoUrl(username, domain, to);
  }

  @Get('servers/bhpanel/admin-sso')
  async getBhpanelAdminSso() {
    return this.whmcs.bhpanelServer.generateAdminSsoUrl();
  }

  @Get('servers/bhpanel/usage')
  async getBhpanelUsage(
    @Query('username') username: string,
    @Query('domain') domain?: string,
  ) {
    return this.whmcs.bhpanelServer.getAccountUsage(username, domain);
  }

  @Post('servers/bhpanel/change-password')
  async changeBhpanelPassword(@Body() body: { username: string; domain: string; newPass: string }) {
    return this.whmcs.bhpanelServer.changePassword(body.username, body.domain, body.newPass);
  }

  @Get('servers/bhpanel/plans')
  async getBhpanelPlans() {
    return this.whmcs.bhpanelServer.getPlans();
  }

  @Get('servers/bhpanel/ping')
  async pingBhpanel() {
    return this.whmcs.bhpanelServer.ping();
  }

  // SERVERS: Virtualizor VPS
  @Post('servers/virtualizor/action')
  async virtualizorAction(@Body() body: { vpsId: string | number; action: 'start' | 'stop' | 'restart' | 'suspend' | 'unsuspend' }) {
    if (body.action === 'start') return this.whmcs.virtualizorServer.startVps(body.vpsId);
    if (body.action === 'stop') return this.whmcs.virtualizorServer.stopVps(body.vpsId);
    if (body.action === 'restart') return this.whmcs.virtualizorServer.restartVps(body.vpsId);
    if (body.action === 'suspend') return this.whmcs.virtualizorServer.suspendVps(body.vpsId);
    if (body.action === 'unsuspend') return this.whmcs.virtualizorServer.unsuspendVps(body.vpsId);
    return { status: 'error', message: 'Invalid action' };
  }

  // ADDONS: Softcents SMS
  @Get('addons/sms/balance')
  async getSmsBalance() {
    return this.whmcs.smsAddon.checkBalance();
  }

  @Get('addons/sms/settings')
  async getSmsSettings() {
    return { success: true, settings: this.whmcs.smsAddon.getSettings() };
  }

  @Post('addons/sms/settings')
  async updateSmsSettings(@Body() body: any) {
    return this.whmcs.smsAddon.updateSettings(body);
  }

  @Get('addons/sms/templates')
  async getSmsTemplates() {
    return { success: true, templates: this.whmcs.smsAddon.getTemplates() };
  }

  @Post('addons/sms/templates/:id')
  async updateSmsTemplate(@Param('id') id: string, @Body() body: any) {
    return this.whmcs.smsAddon.updateTemplate(Number(id), body);
  }

  @Post('addons/sms/send')
  async sendSms(@Body() body: { numbers: string | string[]; message: string; senderId?: string }) {
    return this.whmcs.smsAddon.sendSms(body);
  }

  @Post('addons/sms/trigger-reminders')
  async triggerSmsReminders() {
    const res = await this.whmcsCron.runAutomationCycle();
    return { success: true, message: 'SMS Automation & Reminder Cycle Executed', ...res };
  }

  // ADDONS: WhatsApp Pro
  @Post('addons/whatsapp/send')
  async sendWhatsApp(@Body() body: { phone: string; message: string; mediaUrl?: string }) {
    return this.whmcs.waAddon.sendMessage(body);
  }

  // ADDONS: Italk Multi-Provider Auto Recharge
  @Get('addons/italk-recharge/providers')
  getRechargeProviders() {
    return {
      providers: this.whmcs.rechargeAddon.getProviders(),
      rate: this.whmcs.rechargeAddon.getConversionRate(),
    };
  }

  @Post('addons/italk-recharge/request')
  async submitRechargeRequest(@Body() body: { clientId: string | number; providerId: string; accountNumber: string; amountUsd: number }) {
    return this.whmcs.rechargeAddon.submitRequest(body);
  }

  // ADDONS: Support PIN
  @Get('addons/supportpin/get')
  getSupportPin(@Query('clientId') clientId: string) {
    return this.whmcs.supportPinAddon.getOrGeneratePin(clientId);
  }

  @Post('addons/supportpin/verify')
  verifySupportPin(@Body() body: { clientId: string; pin: string }) {
    const valid = this.whmcs.supportPinAddon.validatePin(body.clientId, body.pin);
    return { valid };
  }

  // DOMAINS: Reseller & Whois (BDWebs Integration)
  @Get('domains/check')
  async checkDomain(@Query('domain') domain: string) {
    return this.whmcs.domainReseller.checkAvailability(domain);
  }

  @Get('domains/pricing')
  async getDomainPricing() {
    return this.whmcs.domainReseller.getTldPricing();
  }

  @Get('domains/:domain/info')
  async getDomainInfo(@Param('domain') domain: string) {
    return this.whmcs.domainReseller.getDomainInformation(domain);
  }

  @Get('domains/:domain/nameservers')
  async getDomainNameservers(@Param('domain') domain: string) {
    return this.whmcs.domainReseller.getNameServers(domain);
  }

  @Post('domains/:domain/nameservers')
  async saveDomainNameservers(
    @Param('domain') domain: string,
    @Body() body: { ns1: string; ns2: string; ns3?: string; ns4?: string; ns5?: string },
  ) {
    return this.whmcs.domainReseller.saveNameServers(domain, body);
  }

  @Get('domains/:domain/lock')
  async getDomainLock(@Param('domain') domain: string) {
    return this.whmcs.domainReseller.getRegistrarLock(domain);
  }

  @Post('domains/:domain/lock')
  async saveDomainLock(@Param('domain') domain: string, @Body() body: { lock: boolean }) {
    return this.whmcs.domainReseller.saveRegistrarLock(domain, body.lock);
  }

  @Get('domains/:domain/epp')
  async getDomainEpp(@Param('domain') domain: string) {
    return this.whmcs.domainReseller.getEppCode(domain);
  }

  // CART: Checkout
  @Post('cart/checkout')
  async checkout(@Body() body: any) {
    return this.whmcs.checkout(body);
  }

  // INVOICES: Cancel
  @Post('invoices/:id/cancel')
  async cancelInvoice(@Param('id') id: string) {
    return this.whmcs.cancelInvoice(id);
  }

  // PROVISIONING: Manual or Hook trigger
  @Post('provision/:serviceId')
  async provision(@Param('serviceId') serviceId: string) {
    return this.whmcs.provisionService(serviceId);
  }
}
