import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { VerificationLevel } from '@prisma/client';

export class RegisterClientDto {
  @IsString()
  @IsNotEmpty({ message: 'Application name is required' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  logoUri?: string;

  @IsArray({ message: 'redirectUris must be an array of valid URLs' })
  @IsNotEmpty()
  redirectUris: string[];

  @IsArray({ message: 'allowedScopes must be an array of scope names' })
  @IsNotEmpty()
  allowedScopes: string[];

  @IsEnum(VerificationLevel)
  @IsOptional()
  requiredVerificationLevel?: VerificationLevel;
}
