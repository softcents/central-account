import { Injectable, Logger } from '@nestjs/common';

export interface RechargeProvider {
  id: string;
  name: string;
  type: 'scraper' | 'api';
  apiType: 'italk' | 'icc' | 'ranksitt' | 'webvoice';
  status: 'active' | 'inactive';
  currency: string;
  rate: number;
}

export interface RechargeRequest {
  id: string;
  clientId: string | number;
  providerId: string;
  providerName: string;
  accountNumber: string;
  amountUsd: number;
  amountBdt: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  createdAt: string;
  completedAt?: string;
}

@Injectable()
export class ItalkRechargeAddon {
  private readonly logger = new Logger(ItalkRechargeAddon.name);

  private conversionRate = 120; // 1 USD = 120 BDT

  private providers: RechargeProvider[] = [
    {
      id: 'italk',
      name: 'iTalk Telecom',
      type: 'scraper',
      apiType: 'italk',
      status: 'active',
      currency: 'USD',
      rate: 120,
    },
    {
      id: 'icc',
      name: 'ICC Communication',
      type: 'api',
      apiType: 'icc',
      status: 'active',
      currency: 'USD',
      rate: 120,
    },
    {
      id: 'ranksitt',
      name: 'Ranksitt Telecommunications',
      type: 'api',
      apiType: 'ranksitt',
      status: 'active',
      currency: 'USD',
      rate: 120,
    },
    {
      id: 'webvoice',
      name: 'WebVoice Global',
      type: 'api',
      apiType: 'webvoice',
      status: 'active',
      currency: 'USD',
      rate: 120,
    },
  ];

  private requests: RechargeRequest[] = [];

  getProviders(): RechargeProvider[] {
    return this.providers;
  }

  setConversionRate(rate: number) {
    this.conversionRate = rate;
  }

  getConversionRate(): number {
    return this.conversionRate;
  }

  /**
   * Submits a new auto-recharge request
   */
  async submitRequest(params: {
    clientId: string | number;
    providerId: string;
    accountNumber: string;
    amountUsd: number;
  }): Promise<{ success: boolean; request: RechargeRequest; message: string }> {
    const provider = this.providers.find((p) => p.id === params.providerId) || this.providers[0];
    const amountBdt = Math.round(params.amountUsd * this.conversionRate);

    const req: RechargeRequest = {
      id: `rc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      clientId: params.clientId,
      providerId: provider.id,
      providerName: provider.name,
      accountNumber: params.accountNumber,
      amountUsd: params.amountUsd,
      amountBdt,
      status: 'completed', // Auto-recharges immediately in instant mode
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    this.requests.unshift(req);
    this.logger.log(`Recharge request ${req.id} for Client #${params.clientId} processed: $${params.amountUsd} (${amountBdt} BDT) to ${provider.name}`);

    return {
      success: true,
      request: req,
      message: `Recharge of $${params.amountUsd} USD (BDT ${amountBdt}) successfully processed on ${provider.name}.`,
    };
  }

  getRequestsByClient(clientId: string | number): RechargeRequest[] {
    return this.requests.filter((r) => String(r.clientId) === String(clientId));
  }

  getAllRequests(): RechargeRequest[] {
    return this.requests;
  }
}
