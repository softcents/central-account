import { Injectable, Logger } from '@nestjs/common';

export interface SupportPinRecord {
  clientId: string | number;
  pin: string;
  generatedAt: number;
  expiresAt: number;
  status: 'active' | 'expired';
}

@Injectable()
export class SupportPinAddon {
  private readonly logger = new Logger(SupportPinAddon.name);
  private pins = new Map<string, SupportPinRecord>();

  private readonly VALID_HOURS = 24;

  /**
   * Gets or generates an active Support PIN for the client
   */
  getOrGeneratePin(clientId: string | number): SupportPinRecord {
    const key = String(clientId);
    const existing = this.pins.get(key);
    const now = Date.now();

    if (existing && existing.expiresAt > now) {
      return existing;
    }

    // Generate 5-digit random PIN between 10000 and 99999
    const pin = String(Math.floor(10000 + Math.random() * 90000));
    const expiresAt = now + this.VALID_HOURS * 3600 * 1000;

    const record: SupportPinRecord = {
      clientId,
      pin,
      generatedAt: now,
      expiresAt,
      status: 'active',
    };

    this.pins.set(key, record);
    this.logger.log(`Generated Support PIN ${pin} for Client #${clientId}`);
    return record;
  }

  /**
   * Validates a provided Support PIN for phone/ticket authentication
   */
  validatePin(clientId: string | number, pin: string): boolean {
    const key = String(clientId);
    const rec = this.pins.get(key);
    if (!rec) return false;
    if (Date.now() > rec.expiresAt) return false;
    return rec.pin === pin.trim();
  }
}
