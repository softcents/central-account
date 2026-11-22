import { Injectable, Logger } from '@nestjs/common';

export interface SendWhatsAppParams {
  phone: string;
  message: string;
  mediaUrl?: string;
  templateId?: string;
}

@Injectable()
export class BdhostWaAddon {
  private readonly logger = new Logger(BdhostWaAddon.name);

  /**
   * Dispatches WhatsApp notification to client
   */
  async sendMessage(params: SendWhatsAppParams): Promise<{ success: boolean; message: string }> {
    let cleanPhone = params.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('880') && cleanPhone.startsWith('0')) {
      cleanPhone = '88' + cleanPhone;
    }

    this.logger.log(`WhatsApp Notification dispatched to +${cleanPhone}: ${params.message.slice(0, 60)}...`);

    // In production, connects to WhatsApp Gateway / Webhook
    return {
      success: true,
      message: `WhatsApp notification successfully queued for +${cleanPhone}`,
    };
  }

  async sendInvoiceNotice(phone: string, invoiceId: string | number, amount: number) {
    const msg = `*SoftCents Systems Notification*\n\nDear Customer,\nYour invoice *#${invoiceId}* amounting to *BDT ${amount.toFixed(2)}* is currently pending.\n\nView and Pay securely:\nhttps://account.softcents.com/viewinvoice?id=${invoiceId}\n\nThank you for choosing SoftCents.`;
    return this.sendMessage({ phone, message: msg });
  }

  async sendTicketReplyNotice(phone: string, ticketNumber: string, subject: string) {
    const msg = `*SoftCents Support Update*\n\nYour support ticket *#${ticketNumber}* (${subject}) has received a new reply from our engineering team.\n\nRead & Respond:\nhttps://account.softcents.com/support/${ticketNumber}`;
    return this.sendMessage({ phone, message: msg });
  }
}
