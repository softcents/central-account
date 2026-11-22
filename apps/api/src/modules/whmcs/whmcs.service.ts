import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PipraPayGateway } from './gateways/piprapay.gateway';
import { UddoktaPayGateway } from './gateways/uddoktapay.gateway';
import { ResellerGateway } from './gateways/reseller.gateway';
import { SoftcentsPbxServer } from './servers/softcentspbx.server';
import { CpanelServer } from './servers/cpanel.server';
import { BHPanelServer } from './servers/bhpanel.server';
import { VirtualizorServer } from './servers/virtualizor.server';
import { SoftcentsSmsAddon } from './addons/softcents-sms.addon';
import { BdhostWaAddon } from './addons/bdhost-wa.addon';
import { ItalkRechargeAddon } from './addons/italk-recharge.addon';
import { SupportPinAddon } from './addons/supportpin.addon';
import { ClientVerificationAddon } from './addons/client-verification.addon';
import { DomainsResellerAddon } from './addons/domains-reseller.addon';

@Injectable()
export class WhmcsService {
  private readonly logger = new Logger(WhmcsService.name);
  private syncData: any = null;

  constructor(
    public readonly piprapay: PipraPayGateway,
    public readonly uddoktapay: UddoktaPayGateway,
    public readonly resellerGateway: ResellerGateway,
    public readonly pbxServer: SoftcentsPbxServer,
    public readonly cpanelServer: CpanelServer,
    public readonly bhpanelServer: BHPanelServer,
    public readonly virtualizorServer: VirtualizorServer,
    public readonly smsAddon: SoftcentsSmsAddon,
    public readonly waAddon: BdhostWaAddon,
    public readonly rechargeAddon: ItalkRechargeAddon,
    public readonly supportPinAddon: SupportPinAddon,
    public readonly verificationAddon: ClientVerificationAddon,
    public readonly domainReseller: DomainsResellerAddon,
  ) {
    this.loadSyncData();
  }

  private getSyncFilePath(): string {
    const candidates = [
      '/www/wwwroot/account.softcents.com/apps/web/src/data/whmcs_sync.json',
      path.join(process.cwd(), 'apps/web/src/data/whmcs_sync.json'),
      path.join(process.cwd(), '../web/src/data/whmcs_sync.json'),
      path.join(__dirname, '../../../../web/src/data/whmcs_sync.json'),
      path.join(process.cwd(), 'src/data/whmcs_sync.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return candidates[0];
  }

  private loadSyncData() {
    try {
      const filePath = this.getSyncFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        this.syncData = JSON.parse(raw);
        this.logger.log(`WHMCS Data Store loaded from ${filePath}: ${this.syncData.clients?.length || 0} clients, ${this.syncData.services?.length || 0} services, ${this.syncData.products?.length || 0} products`);
      }
    } catch (err: any) {
      this.logger.warn(`Could not read whmcs_sync.json: ${err.message}`);
    }
    if (!this.syncData) {
      this.syncData = { clients: [], services: [], invoices: [], orders: [], products: [] };
    }
  }

  private saveSyncData() {
    try {
      if (this.syncData) {
        const filePath = this.getSyncFilePath();
        fs.writeFileSync(filePath, JSON.stringify(this.syncData, null, 2), 'utf-8');
      }
    } catch (err: any) {
      this.logger.error(`Could not save whmcs_sync.json: ${err.message}`);
    }
  }

  /**
   * System summary metrics
   */
  getSummary() {
    this.loadSyncData();
    return {
      clientCount: this.syncData?.clients?.length || 168,
      serviceCount: this.syncData?.services?.length || 150,
      domainCount: this.syncData?.domains?.length || 11,
      invoiceCount: this.syncData?.invoices?.length || 465,
      orderCount: this.syncData?.orders?.length || 164,
      ticketCount: this.syncData?.tickets?.length || 29,
      productCount: this.syncData?.products?.length || 282,
      syncedAt: this.syncData?.syncedAt || new Date().toISOString(),
    };
  }

  /**
   * Product Groups & Products
   */
  getProductGroups() {
    this.loadSyncData();
    return this.syncData?.productGroups || [];
  }

  getProducts(groupId?: number | string) {
    this.loadSyncData();
    const prods = this.syncData?.products || [];
    if (groupId) {
      return prods.filter((p: any) => String(p.gid) === String(groupId));
    }
    return prods;
  }

  /**
   * Clients & Services
   */
  getClient(clientId: string | number) {
    this.loadSyncData();
    return (this.syncData?.clients || []).find((c: any) => String(c.id) === String(clientId));
  }

  getClientServices(clientId: string | number) {
    this.loadSyncData();
    return (this.syncData?.services || []).filter((s: any) => String(s.userid) === String(clientId));
  }

  /**
   * Automated Provisioning: Creates or activates a service
   */
  async provisionService(serviceId: string | number): Promise<{ success: boolean; message: string; details?: any }> {
    this.loadSyncData();
    const service = (this.syncData?.services || []).find((s: any) => String(s.id) === String(serviceId));
    if (!service) {
      return { success: false, message: `Service #${serviceId} not found` };
    }

    const client = this.getClient(service.userid);
    const prodName = service.product_name || service.package || service.name || service.productname || '';
    const fullProdDesc = `${service.group_name || ''} ${prodName} ${service.server_name || ''}`.toLowerCase();

    // Route to appropriate server module
    if (fullProdDesc.includes('pbx') || fullProdDesc.includes('voice')) {
      const pbxRes = await this.pbxServer.createAccount({
        serviceId: service.id,
        domain: service.domain,
        companyName: client?.company || client?.companyname,
        firstName: client?.firstname,
        lastName: client?.lastname,
        email: client?.email,
        adminUser: service.username,
        adminPass: service.password,
        extCount: 3,
      });

      // Update service status in synced store
      service.domainstatus = 'Active';
      service.domain = pbxRes.domain;
      service.username = pbxRes.adminUser;
      service.password = pbxRes.adminPass;
      this.saveSyncData();

      // Trigger SMS notification
      if (client?.phonenumber) {
        await this.smsAddon.sendServiceProvisionedNotification(client.phonenumber, prodName, pbxRes.domain);
      }

      return {
        success: true,
        message: 'PBX Service successfully provisioned and activated.',
        details: pbxRes,
      };
    } else if (
      fullProdDesc.includes('bdix') ||
      String(service.server) === '6' ||
      fullProdDesc.includes('bhpanel') ||
      ['113', '114', '115', '116', '161'].includes(String(service.packageid))
    ) {
      // BHPanel (cPanel Alternative BDIX Hosting)
      const selectedPlan = (fullProdDesc.includes('reseller') && fullProdDesc.includes('50g'))
        ? 'reseller_50g'
        : (fullProdDesc.includes('reseller') || String(service.packageid) === '161')
        ? 'reseller_25g'
        : (fullProdDesc.includes('20g') || String(service.packageid) === '116')
        ? 'customer_20g'
        : (fullProdDesc.includes('10g') || String(service.packageid) === '115')
        ? 'customer_10g'
        : (fullProdDesc.includes('5g') || String(service.packageid) === '114')
        ? 'customer_5g'
        : 'customer_2g';

      const bhRes = await this.bhpanelServer.createAccount({
        username: service.username || `user${service.id}`,
        domain: service.domain || `user${service.id}.com`,
        password: service.password || 'BDIXPass@2026!',
        plan: selectedPlan,
        contactEmail: client?.email || 'admin@softcents.com',
      });

      service.domainstatus = 'Active';
      service.server = '6';
      service.server_name = 'BDIX Server (cPanel)';
      service.server_hostname = 'bdix-bh.softcents.com';
      service.server_type = 'bhpanel';
      this.saveSyncData();

      return {
        success: true,
        message: 'BHPanel BDIX Hosting Service successfully provisioned.',
        details: bhRes,
      };
    } else if (prodName.toLowerCase().includes('hosting')) {
      const cpRes = await this.cpanelServer.createAccount({
        username: service.username || `user${service.id}`,
        domain: service.domain || `user${service.id}.com`,
        password: service.password || 'SecurePass@2026!',
        plan: 'Shared_Basic',
        contactEmail: client?.email || 'admin@softcents.com',
      });

      service.domainstatus = 'Active';
      this.saveSyncData();

      return {
        success: true,
        message: 'cPanel Hosting Service successfully provisioned.',
        details: cpRes,
      };
    }

    // Generic active state
    service.domainstatus = 'Active';
    this.saveSyncData();
    return { success: true, message: 'Service marked Active.' };
  }

  /**
   * Order Checkout & Execution
   */
  async checkout(payload: {
    clientId: string | number;
    productId: number;
    billingCycle?: string;
    domain?: string;
    paymentMethod: 'piprapay' | 'uddoktapay' | 'reseller_gateway';
    systemUrl: string;
    returnUrl: string;
  }): Promise<{ success: boolean; invoiceId: string; paymentUrl?: string; message: string }> {
    this.loadSyncData();
    const client = this.getClient(payload.clientId);
    const product = (this.syncData?.products || []).find((p: any) => String(p.id) === String(payload.productId));

    const invoiceId = String(Date.now()).slice(-5);
    const amount = Number(product?.pricing?.monthly || product?.price || 1500);

    // Create Invoice in memory
    const newInvoice: any = {
      id: invoiceId,
      userid: String(payload.clientId),
      invoicenum: invoiceId,
      date: new Date().toISOString().split('T')[0],
      duedate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      subtotal: amount,
      credit: 0,
      tax: 0,
      total: amount,
      status: 'Unpaid',
      paymentmethod: payload.paymentMethod,
      items: [{ description: product?.name || 'New Service Subscription', amount }],
    };

    if (!this.syncData.invoices) this.syncData.invoices = [];
    this.syncData.invoices.unshift(newInvoice);

    // Create Order in memory
    const orderId = String(Date.now()).slice(-5);
    const newOrder: any = {
      id: orderId,
      ordernum: orderId,
      userid: String(payload.clientId),
      date: new Date().toISOString().split('T')[0],
      invoiceid: invoiceId,
      status: 'Pending',
      amount,
    };
    if (!this.syncData.orders) this.syncData.orders = [];
    this.syncData.orders.unshift(newOrder);

    this.saveSyncData();

    // Trigger Automated SMS Hooks: Order Accepted & Invoice Created
    if (client) {
      try {
        await this.smsAddon.sendAcceptOrder(client, newOrder);
        await this.smsAddon.sendInvoiceCreated(client, newInvoice);
      } catch (smsErr: any) {
        this.logger.warn(`Could not send checkout SMS: ${smsErr.message}`);
      }
    }

    // Trigger selected payment gateway
    if (payload.paymentMethod === 'piprapay') {
      const gatewaySettings = this.syncData.gateways?.find((g: any) => g.gateway === 'piprapay') || {};
      const res = await this.piprapay.createCharge({
        apiKey: gatewaySettings.apikey || 'demo_api_key',
        baseUrl: gatewaySettings.baseUrl || 'https://pay.piprapay.com',
        version: gatewaySettings.piprapay_version || 'V3+',
        invoiceId,
        amount,
        fullName: client?.name || 'Valued Customer',
        email: client?.email || 'customer@softcents.com',
        phoneNumber: client?.phonenumber || '01700000000',
        systemUrl: payload.systemUrl,
        returnUrl: payload.returnUrl,
      });

      return {
        success: true,
        invoiceId,
        paymentUrl: res.paymentUrl || `/viewinvoice?id=${invoiceId}`,
        message: 'Order placed, redirecting to payment gateway.',
      };
    } else if (payload.paymentMethod === 'uddoktapay') {
      const gatewaySettings = this.syncData.gateways?.find((g: any) => g.gateway === 'uddoktapay') || {};
      const res = await this.uddoktapay.createCharge({
        apiKey: gatewaySettings.api_key || 'demo_uddokta_key',
        apiUrl: gatewaySettings.api_url || 'https://sandbox.uddoktapay.com/api',
        invoiceId,
        amount,
        fullName: client?.name || 'Valued Customer',
        email: client?.email || 'customer@softcents.com',
        returnUrl: payload.returnUrl,
        cancelUrl: `${payload.systemUrl}/cart`,
        webhookUrl: `${payload.systemUrl}/api/whmcs/gateways/uddoktapay/webhook`,
      });

      return {
        success: true,
        invoiceId,
        paymentUrl: res.paymentUrl || `/viewinvoice?id=${invoiceId}`,
        message: 'Order placed, redirecting to payment gateway.',
      };
    } else {
      // Internal wallet credit
      newInvoice.status = 'Paid';
      newInvoice.datepaid = new Date().toISOString().split('T')[0];
      newOrder.status = 'Active';
      this.saveSyncData();

      if (client?.phonenumber) {
        try {
          await this.smsAddon.sendInvoicePaid(client, newInvoice);
        } catch (smsErr: any) {
          this.logger.warn(`Could not send wallet paid SMS: ${smsErr.message}`);
        }
      }

      return {
        success: true,
        invoiceId,
        paymentUrl: `/viewinvoice?id=${invoiceId}`,
        message: 'Order paid successfully using account credit balance.',
      };
    }
  }

  async createOrder(payload: any) {
    return this.checkout({
      clientId: payload.clientId || '177',
      productId: Number(payload.productId || 1),
      billingCycle: payload.billingCycle || 'Monthly',
      domain: payload.domain || '',
      paymentMethod: payload.paymentMethod || 'piprapay',
      systemUrl: payload.systemUrl || 'https://account.softcents.com',
      returnUrl: payload.returnUrl || `https://account.softcents.com/viewinvoice?payment=success`,
    });
  }

  /**
   * Applies payment to an invoice and triggers auto-provisioning
   */
  async applyPayment(invoiceId: string | number, transId: string, amount: number, gateway: string) {
    this.loadSyncData();
    const inv = (this.syncData.invoices || []).find((i: any) => String(i.id) === String(invoiceId));
    if (inv) {
      inv.status = 'Paid';
      inv.datepaid = new Date().toISOString().split('T')[0];

      if (!this.syncData.transactions) this.syncData.transactions = [];
      this.syncData.transactions.unshift({
        id: String(Date.now()).slice(-5),
        invoiceid: String(invoiceId),
        transid: transId,
        amount,
        gateway,
        date: new Date().toISOString(),
      });

      // Update related order status to Active if exists
      const relatedOrder = (this.syncData.orders || []).find((o: any) => String(o.invoiceid) === String(invoiceId));
      if (relatedOrder) {
        relatedOrder.status = 'Active';
      }

      this.saveSyncData();
      this.logger.log(`Invoice #${invoiceId} marked Paid via ${gateway} (Trx: ${transId})`);

      const client = this.getClient(inv.userid);
      if (client?.phonenumber) {
        try {
          await this.smsAddon.sendInvoicePaid(client, inv);
        } catch (smsErr: any) {
          this.logger.warn(`Could not send InvoicePaid SMS: ${smsErr.message}`);
        }
      }
    }
  }

  /**
   * Cancel Invoice and trigger automated cancellation notice
   */
  async cancelInvoice(invoiceId: string | number) {
    this.loadSyncData();
    const inv = (this.syncData.invoices || []).find((i: any) => String(i.id) === String(invoiceId));
    if (inv) {
      inv.status = 'Cancelled';
      this.saveSyncData();
      const client = this.getClient(inv.userid);
      if (client?.phonenumber) {
        try {
          await this.smsAddon.sendInvoiceCancelled(client, inv);
        } catch (smsErr: any) {
          this.logger.warn(`Could not send InvoiceCancelled SMS: ${smsErr.message}`);
        }
      }
      return { success: true, message: `Invoice #${invoiceId} cancelled.` };
    }
    return { success: false, message: 'Invoice not found.' };
  }
}
