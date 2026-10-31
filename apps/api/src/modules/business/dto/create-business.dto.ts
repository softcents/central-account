import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty({ message: 'Legal business name is required' })
  legalName: string;

  @IsString()
  @IsOptional()
  tradeName?: string;

  @IsString()
  @IsNotEmpty({ message: 'Business type is required (e.g., LLC, CORPORATION)' })
  businessType: string;

  @IsString()
  @IsNotEmpty({ message: 'Country code is required' })
  countryCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Registered business address is required' })
  address: string;

  @IsEmail({}, { message: 'A valid business email is required' })
  @IsNotEmpty({ message: 'Business email is required' })
  businessEmail: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsNotEmpty({ message: 'Trade license or registration number is required' })
  tradeLicenseNumber: string;

  @IsString()
  @IsOptional()
  licenseIssueDate?: string;

  @IsString()
  @IsOptional()
  licenseExpiryDate?: string;

  @IsString()
  @IsOptional()
  issuingAuthority?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
