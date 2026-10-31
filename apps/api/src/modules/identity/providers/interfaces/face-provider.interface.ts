export interface FaceQualityResult {
  isAcceptable: boolean;
  qualityScore: number;
  checks: {
    hasSingleFace: boolean;
    isClear: boolean;
    goodLighting: boolean;
    isCentered: boolean;
  };
  issues: string[];
}

export interface FaceMatchResult {
  isMatched: boolean;
  matchScore: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  threshold: number;
}

export interface FaceVerificationProviderInterface {
  assessQuality(imageBase64: string): Promise<FaceQualityResult>;
  matchFaces(idImageBase64: string, liveImageBase64: string): Promise<FaceMatchResult>;
}
