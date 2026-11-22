import { Controller, Get, Post, Body, Query, Headers, Param, Res, HttpStatus } from '@nestjs/common';
import { WhmcsService } from './whmcs.service';

@Controller('whmcs')
export class WhmcsController {
  constructor(private readonly whmcs: WhmcsService) {}

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

  // ADDONS: Softcents SMS
  @Get('addons/sms/balance')
  async getSmsBalance() {
    return this.whmcs.smsAddon.checkBalance();
  }

  @Post('addons/sms/send')
  async sendSms(@Body() body: { numbers: string | string[]; message: string; senderId?: string }) {
    return this.whmcs.smsAddon.sendSms(body);
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

  // DOMAINS: Reseller & Whois
  @Get('domains/check')
  async checkDomain(@Query('domain') domain: string) {
    return this.whmcs.domainReseller.checkAvailability(domain);
  }

  // CART: Checkout
  @Post('cart/checkout')
  async checkout(@Body() body: any) {
    return this.whmcs.checkout(body);
  }

  // PROVISIONING: Manual or Hook trigger
  @Post('provision/:serviceId')
  async provision(@Param('serviceId') serviceId: string) {
    return this.whmcs.provisionService(serviceId);
  }
}
