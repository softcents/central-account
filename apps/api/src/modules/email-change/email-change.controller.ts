import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { EmailChangeService } from './email-change.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { ConfirmEmailChangeDto } from './dto/confirm-email-change.dto';

@Controller('auth/email-change')
export class EmailChangeController {
  constructor(private readonly emailChangeService: EmailChangeService) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async requestChange(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestEmailChangeDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.emailChangeService.requestEmailChange(userId, dto, ipAddress, userAgent);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@CurrentUser('id') userId: string) {
    const active = await this.emailChangeService.getActiveRequest(userId);
    return { hasActiveRequest: !!active, request: active };
  }

  @Public()
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirmChange(
    @Body() dto: ConfirmEmailChangeDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    // Extract current sessionId from auth token/cookie if user happens to be logged in
    const currentSessionId = (req as any).user?.sessionId;
    return this.emailChangeService.confirmEmailChange(dto.token, currentSessionId, ipAddress, userAgent);
  }
}
