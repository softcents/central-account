export interface ExtractedDocumentFields {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  dateOfBirth?: string;
  issueDate?: string;
  expiryDate?: string;
  nationality?: string;
  gender?: string;
  address?: string;
}

export interface DocumentClassificationResult {
  classification: 'GENUINE' | 'SUSPICIOUS' | 'FAKE';
  isAuthenticDocument: boolean;
  authenticityScore: number;
  signals: Record<string, any>;
  reasons: string[];
  recommendation: string;
}

export interface DocumentOcrResultData {
  success: boolean;
  documentType: string;
  countryCode: string;
  confidenceScore: number;
  fieldConfidences: Record<string, number>;
  fields: ExtractedDocumentFields;
  mrzData?: Record<string, any>;
  authenticity: {
    isValid: boolean;
    isExpired: boolean;
    mrzChecksumValid: boolean;
    reasons: string[];
  };
  documentClassification?: DocumentClassificationResult;
}

export interface BusinessTradeLicenseOcrResultData {
  success: boolean;
  confidenceScore: number;
  fieldConfidences: Record<string, number>;
  fields: {
    legalName?: string;
    tradeLicenseNumber?: string;
    issuingAuthority?: string;
    issueDate?: string;
    expiryDate?: string;
    address?: string;
  };
  isValid: boolean;
  isExpired: boolean;
}

export interface OCRProviderInterface {
  extractDocumentOcr(
    imageBase64: string,
    documentType: string,
    countryCode: string,
  ): Promise<DocumentOcrResultData>;

  extractBusinessOcr(
    imageBase64: string,
    countryCode: string,
  ): Promise<BusinessTradeLicenseOcrResultData>;
}
