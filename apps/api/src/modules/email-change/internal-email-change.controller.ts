import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { EmailChangeService } from './email-change.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('internal/email-change')
@UseGuards(JwtAuthGuard)
export class InternalEmailChangeController {
  constructor(private readonly emailChangeService: EmailChangeService) {}

  @Post(':ticketId/decision')
  @HttpCode(HttpStatus.OK)
  async recordDecision(
    @Param('ticketId') ticketId: string,
    @Body('action') action: 'APPROVE' | 'REJECT',
    @Body('notes') notes: string | undefined,
    @CurrentUser('id') adminId: string,
    @CurrentUser('email') adminEmail: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.emailChangeService.recordAdminDecision(
      ticketId,
      action,
      notes,
      adminId,
      adminEmail,
      ipAddress,
      userAgent,
    );
  }
}
