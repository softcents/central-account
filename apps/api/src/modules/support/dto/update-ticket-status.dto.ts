import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TicketPriority, TicketStatus } from '@prisma/client';

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus, {
    message: 'Status must be one of: OPEN, IN_REVIEW, WAITING_FOR_USER, APPROVED, REJECTED, CLOSED',
  })
  @IsOptional()
  status?: TicketStatus;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsString()
  @IsOptional()
  assignedAdmin?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
