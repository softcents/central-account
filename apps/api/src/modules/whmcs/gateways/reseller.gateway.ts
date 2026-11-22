import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ResellerGateway {
  private readonly logger = new Logger(ResellerGateway.name);

  /**
   * Processes wallet balance / credit deduction payment
   */
  async processPayment(params: {
    clientId: string | number;
    amount: number;
    currentBalance: number;
    invoiceId: string | number;
  }): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    if (params.currentBalance < params.amount) {
      return {
        success: false,
        error: `Insufficient balance. Available: BDT ${params.currentBalance.toFixed(2)}, Required: BDT ${params.amount.toFixed(2)}`,
      };
    }

    const newBalance = Number((params.currentBalance - params.amount).toFixed(2));
    this.logger.log(`Deducted BDT ${params.amount} from Client #${params.clientId} for Invoice #${params.invoiceId}. New balance: BDT ${newBalance}`);

    return {
      success: true,
      newBalance,
    };
  }
}
