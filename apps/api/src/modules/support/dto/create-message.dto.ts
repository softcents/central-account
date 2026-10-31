import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { TicketAttachmentDto } from './create-ticket.dto';

export class CreateMessageDto {
  @IsString()
  @MinLength(1, { message: 'Message content cannot be empty' })
  message: string;

  @IsOptional()
  attachments?: TicketAttachmentDto[];
}
