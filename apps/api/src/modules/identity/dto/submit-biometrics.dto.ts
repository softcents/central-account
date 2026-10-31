import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitBiometricsDto {
  @IsString()
  @IsNotEmpty({ message: 'Verification ID is required' })
  verificationId: string;

  @IsString()
  @IsNotEmpty({ message: 'Liveness session ID is required' })
  sessionId: string;

  @IsString()
  @IsNotEmpty({ message: 'Challenge type is required' })
  challengeType: string;

  @IsString()
  @IsNotEmpty({ message: 'Live face frame is required' })
  liveFrameBase64: string;

  @IsOptional()
  clientResponse?: Record<string, any>;
}
