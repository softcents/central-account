export interface DocumentAuthenticityResult {
  isValid: boolean;
  isExpired: boolean;
  mrzChecksumValid: boolean;
  reasons: string[];
}

export interface DocumentVerificationProviderInterface {
  verifyDocumentAuthenticity(
    imageBase64: string,
    documentType: string,
    countryCode: string,
  ): Promise<DocumentAuthenticityResult>;
}
