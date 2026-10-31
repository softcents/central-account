import { IsNotEmpty, IsString } from 'class-validator';

export class UploadBusinessDocumentDto {
  @IsString()
  @IsNotEmpty({ message: 'Document type code is required (e.g., TRADE_LICENSE)' })
  documentTypeCode: string;

  @IsString()
  @IsNotEmpty({ message: 'File payload is required' })
  fileBase64: string;

  @IsString()
  @IsNotEmpty({ message: 'File name is required' })
  fileName: string;
}
