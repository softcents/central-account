import { Injectable, Logger } from '@nestjs/common';

export interface UddoktaPayChargeParams {
  apiKey: string;
  apiUrl: string;
  exchangeRate?: number;
  invoiceId: number | string;
  amount: number;
  fullName: string;
  email: string;
  returnUrl: string;
  cancelUrl: string;
  webhookUrl: string;
}

export interface UddoktaPayVerifyParams {
  apiKey: string;
  apiUrl: string;
  invoiceId: string;
}

@Injectable()
export class UddoktaPayGateway {
  private readonly logger = new Logger(UddoktaPayGateway.name);

  private normalizeBaseUrl(url: string): string {
    let clean = url.replace(/\/+$/, '');
    const apiIndex = clean.indexOf('/api');
    if (apiIndex !== -1) {
      clean = clean.substring(0, apiIndex + 4);
    }
    return clean;
  }

  /**
   * Initializes payment with UddoktaPay (Checkout-v2)
   */
  async createCharge(params: UddoktaPayChargeParams): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
    const baseUrl = this.normalizeBaseUrl(params.apiUrl);
    const chargeUrl = `${baseUrl}/checkout-v2`;

    const convoRate = Number(params.exchangeRate) || 1;
    const finalAmount = Math.ceil(params.amount * convoRate);

    const payload = {
      full_name: params.fullName,
      email: params.email,
      amount: finalAmount,
      metadata: { invoice_id: String(params.invoiceId) },
      redirect_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      webhook_url: params.webhookUrl,
    };

    try {
      const response = await fetch(chargeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'RT-UDDOKTAPAY-API-KEY': params.apiKey,
        },
        body: JSON.stringify(payload),
      });

      const result: any = await response.json();
      if (result && result.payment_url) {
        return { success: true, paymentUrl: result.payment_url };
      }
      return { success: false, error: result?.message || 'UddoktaPay payment initialization failed' };
    } catch (err: any) {
      this.logger.error(`UddoktaPay charge error: ${err.message}`, err.stack);
      return { success: false, error: err.message };
    }
  }

  /**
   * Verifies payment with UddoktaPay API
   */
  async verifyPayment(params: UddoktaPayVerifyParams): Promise<{ success: boolean; status?: string; data?: any }> {
    const baseUrl = this.normalizeBaseUrl(params.apiUrl);
    const verifyUrl = `${baseUrl}/verify-payment`;

    try {
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'RT-UDDOKTAPAY-API-KEY': params.apiKey,
        },
        body: JSON.stringify({ invoice_id: params.invoiceId }),
      });

      const result: any = await response.json();
      const status = String(result?.status || '').toUpperCase();
      return {
        success: status === 'COMPLETED',
        status: result?.status,
        data: result,
      };
    } catch (err: any) {
      this.logger.error(`UddoktaPay verify error: ${err.message}`);
      return { success: false, status: 'ERROR', data: err.message };
    }
  }
}
