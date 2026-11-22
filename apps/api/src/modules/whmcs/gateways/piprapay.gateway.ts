import { Injectable, Logger } from '@nestjs/common';

export interface PipraPayChargeParams {
  apiKey: string;
  baseUrl: string;
  version?: 'V2' | 'V3+';
  invoiceId: number | string;
  amount: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  currency?: string;
  systemUrl: string;
  returnUrl: string;
}

export interface PipraPayVerifyParams {
  apiKey: string;
  baseUrl: string;
  ppId: string;
  version?: 'V2' | 'V3+';
}

@Injectable()
export class PipraPayGateway {
  private readonly logger = new Logger(PipraPayGateway.name);

  /**
   * Generates a payment redirect link using PipraPay API
   */
  async createCharge(params: PipraPayChargeParams): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
    const isV2 = params.version === 'V2';
    const baseUrl = params.baseUrl.replace(/\/+$/, '');
    const callbackUrl = `${params.systemUrl.replace(/\/+$/, '')}/api/whmcs/gateways/piprapay/callback`;

    try {
      if (isV2) {
        const postData = {
          full_name: params.fullName,
          email_mobile: params.email,
          amount: params.amount,
          metadata: { invoiceid: String(params.invoiceId) },
          redirect_url: params.returnUrl,
          cancel_url: params.systemUrl,
          webhook_url: callbackUrl,
          return_type: 'GET',
          currency: params.currency || 'BDT',
        };

        const response = await fetch(`${baseUrl}/api/create-charge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            accept: 'application/json',
            'mh-piprapay-api-key': params.apiKey,
          },
          body: JSON.stringify(postData),
        });

        const result: any = await response.json();
        if (result && result.pp_url) {
          return { success: true, paymentUrl: result.pp_url };
        }
        return { success: false, error: result?.message || 'PipraPay V2 charge creation failed' };
      } else {
        // V3+ API
        const postData = {
          full_name: params.fullName,
          email_address: params.email || 'customer@softcents.com',
          mobile_number: params.phoneNumber || '01700000000',
          amount: params.amount,
          metadata: { invoiceid: String(params.invoiceId) },
          return_url: params.returnUrl,
          webhook_url: callbackUrl,
          currency: params.currency || 'BDT',
        };

        const response = await fetch(`${baseUrl}/checkout/redirect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            accept: 'application/json',
            'MHS-PIPRAPAY-API-KEY': params.apiKey,
          },
          body: JSON.stringify(postData),
        });

        const result: any = await response.json();
        if (result && result.pp_url) {
          return { success: true, paymentUrl: result.pp_url };
        }
        return {
          success: false,
          error: result?.error?.message || result?.message || 'PipraPay V3+ charge creation failed',
        };
      }
    } catch (err: any) {
      this.logger.error(`PipraPay charge creation error: ${err.message}`, err.stack);
      return { success: false, error: err.message };
    }
  }

  /**
   * Verifies payment with PipraPay API
   */
  async verifyPayment(params: PipraPayVerifyParams): Promise<{ success: boolean; status?: string; data?: any }> {
    const baseUrl = params.baseUrl.replace(/\/+$/, '');
    try {
      const response = await fetch(`${baseUrl}/api/verify-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'mh-piprapay-api-key': params.apiKey,
        },
        body: JSON.stringify({ pp_id: params.ppId }),
      });

      const result: any = await response.json();
      const status = String(result?.status || '').toLowerCase();
      return {
        success: status === 'completed',
        status: result?.status,
        data: result,
      };
    } catch (err: any) {
      this.logger.error(`PipraPay verification error: ${err.message}`);
      return { success: false, status: 'error', data: err.message };
    }
  }
}
