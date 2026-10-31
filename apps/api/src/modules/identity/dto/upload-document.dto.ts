import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty({ message: 'Verification session ID is required' })
  verificationId: string;

  @IsString()
  @IsNotEmpty({ message: 'Document type code is required' })
  documentType: string;

  @IsString()
  @IsNotEmpty({ message: 'Country code is required' })
  countryCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Front image payload is required' })
  frontImageBase64: string;

  @IsString()
  @IsOptional()
  backImageBase64?: string;
}
