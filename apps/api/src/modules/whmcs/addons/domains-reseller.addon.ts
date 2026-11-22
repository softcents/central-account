import { Injectable, Logger } from '@nestjs/common';

export interface DomainCheckResult {
  domain: string;
  status: 'available' | 'unavailable';
  pricing?: {
    register: number;
    renew: number;
    transfer: number;
    currency: string;
  };
}

@Injectable()
export class DomainsResellerAddon {
  private readonly logger = new Logger(DomainsResellerAddon.name);

  private readonly DEFAULT_PRICING: Record<string, { register: number; renew: number; transfer: number }> = {
    com: { register: 1450, renew: 1650, transfer: 1450 },
    net: { register: 1650, renew: 1850, transfer: 1650 },
    org: { register: 1750, renew: 1950, transfer: 1750 },
    info: { register: 1250, renew: 2450, transfer: 1850 },
    xyz: { register: 350, renew: 1650, transfer: 1450 },
    bd: { register: 1950, renew: 1950, transfer: 1950 },
    'com.bd': { register: 1950, renew: 1950, transfer: 1950 },
  };

  /**
   * Checks domain availability and pricing
   */
  async checkAvailability(domainName: string): Promise<DomainCheckResult> {
    const cleanDomain = domainName.toLowerCase().trim();
    const parts = cleanDomain.split('.');
    const tld = parts.length > 1 ? parts.slice(1).join('.') : 'com';

    const pricing = this.DEFAULT_PRICING[tld] || {
      register: 1500,
      renew: 1700,
      transfer: 1500,
    };

    // Standard lookup check simulation
    const isTaken = ['google.com', 'facebook.com', 'softcents.com', 'bdpbx.com'].includes(cleanDomain);

    return {
      domain: cleanDomain,
      status: isTaken ? 'unavailable' : 'available',
      pricing: {
        ...pricing,
        currency: 'BDT',
      },
    };
  }

  /**
   * Registers a new domain
   */
  async registerDomain(params: { domain: string; years: number; nameservers: string[] }) {
    this.logger.log(`Registering domain ${params.domain} for ${params.years} years with NS: ${params.nameservers.join(', ')}`);
    return {
      success: true,
      domain: params.domain,
      status: 'Active',
      expiryDate: new Date(Date.now() + params.years * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    };
  }

  /**
   * Transfers a domain from an external registrar
   */
  async transferDomain(params: { domain: string; eppCode: string }) {
    this.logger.log(`Initiating domain transfer for ${params.domain} (EPP: ${params.eppCode})`);
    return {
      success: true,
      domain: params.domain,
      status: 'Pending Transfer',
    };
  }

  /**
   * Updates domain nameservers
   */
  async updateNameservers(params: { domain: string; nameservers: string[] }) {
    this.logger.log(`Updated nameservers for ${params.domain}: ${params.nameservers.join(', ')}`);
    return {
      success: true,
      domain: params.domain,
      nameservers: params.nameservers,
    };
  }
}
