import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { MfaService } from './mfa.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EnableMfaDto } from './dto/enable-mfa.dto';

@Controller('mfa')
@UseGuards(JwtAuthGuard)
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Get('status')
  async getStatus(@CurrentUser('id') userId: string) {
    return this.mfaService.getMfaStatus(userId);
  }

  @Post('generate')
  async generateSecret(@CurrentUser() user: { id: string; email: string }) {
    return this.mfaService.generateMfaSecret(user);
  }

  @Post('enable')
  async enable(
    @CurrentUser('id') userId: string,
    @Body() body: EnableMfaDto & { backupCodes?: string[] },
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const backupCodes = body.backupCodes || [];

    return this.mfaService.enableMfa(
      userId,
      body.secret,
      body.code,
      backupCodes,
      ipAddress,
      userAgent,
    );
  }

  @Post('disable')
  async disable(@CurrentUser('id') userId: string, @Req() req: Request) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.mfaService.disableMfa(userId, ipAddress, userAgent);
  }
}
