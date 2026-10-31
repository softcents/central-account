import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TicketCategory, TicketPriority } from '@prisma/client';

export class TicketAttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileBase64: string;

  @IsString()
  @IsOptional()
  mimeType?: string;
}

export class CreateTicketDto {
  @IsEnum(TicketCategory, {
    message: 'Category must be one of: EMAIL_CHANGE, IDENTITY_VERIFICATION, BUSINESS_VERIFICATION, ACCOUNT_SECURITY, GENERAL_SUPPORT',
  })
  category: TicketCategory;

  @IsString()
  @MinLength(3, { message: 'Subject must be at least 3 characters long' })
  @MaxLength(200, { message: 'Subject must not exceed 200 characters' })
  subject: string;

  @IsString()
  @MinLength(5, { message: 'Description must be at least 5 characters long' })
  description: string;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsOptional()
  attachments?: TicketAttachmentDto[];
}
