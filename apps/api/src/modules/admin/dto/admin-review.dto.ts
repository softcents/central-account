import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ReviewDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST_RESUBMIT = 'REQUEST_RESUBMIT',
}

export class ReviewKycDto {
  @IsEnum(ReviewDecision)
  decision: ReviewDecision;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReviewKybDto {
  @IsEnum(ReviewDecision)
  decision: ReviewDecision;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateUserStatusDto {
  @IsString()
  @IsNotEmpty()
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateTenantStatusDto {
  @IsString()
  @IsNotEmpty()
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';

  @IsOptional()
  @IsString()
  planId?: string;
}

export class AdminTicketReplyDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  status?: 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
}
