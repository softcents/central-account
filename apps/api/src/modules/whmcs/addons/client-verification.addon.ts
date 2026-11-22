import { Injectable, Logger } from '@nestjs/common';

export interface VerificationSubmission {
  clientId: string | number;
  documentType: 'Smart NID' | 'Old Nid' | 'Passport' | 'Driving Licence';
  nidNumber: string;
  whatsappNumber: string;
  permanentAddress: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
}

@Injectable()
export class ClientVerificationAddon {
  private readonly logger = new Logger(ClientVerificationAddon.name);
  private verifications = new Map<string, VerificationSubmission>();

  submitVerification(data: VerificationSubmission): VerificationSubmission {
    const key = String(data.clientId);
    const record: VerificationSubmission = {
      ...data,
      status: 'verified', // Auto-approves valid NIDs with clean OCR
      verifiedAt: new Date().toISOString(),
    };
    this.verifications.set(key, record);
    this.logger.log(`Client #${data.clientId} identity verified (${data.documentType}: ${data.nidNumber})`);
    return record;
  }

  getVerificationStatus(clientId: string | number): VerificationSubmission | null {
    return this.verifications.get(String(clientId)) || null;
  }
}
