export interface LivenessChallengeResult {
  sessionId: string;
  challengeType: string;
  instructions: string;
  expiresInSeconds: number;
}

export interface LivenessVerificationResult {
  isLive: boolean;
  activePassed: boolean;
  passiveLivenessScore: number;
  challengeType: string;
  reasons: string[];
}

export interface LivenessProviderInterface {
  createChallenge(userId: string): Promise<LivenessChallengeResult>;
  verifyLiveness(
    sessionId: string,
    challengeType: string,
    frameBase64: string,
    clientResponse?: Record<string, any>,
  ): Promise<LivenessVerificationResult>;
}
