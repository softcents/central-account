import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyMfaDto {
  @IsString()
  @IsNotEmpty({ message: 'MFA challenge token is required' })
  mfaToken: string;

  @IsString()
  @IsNotEmpty({ message: 'Verification code or recovery code is required' })
  code: string;
}
