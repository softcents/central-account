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
import { IdentityService } from './identity.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { SubmitBiometricsDto } from './dto/submit-biometrics.dto';

@Controller('identity')
@UseGuards(JwtAuthGuard)
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Get('session')
  async getSession(@CurrentUser('id') userId: string) {
    return this.identityService.getOrCreateSession(userId);
  }

  @Post('document')
  @HttpCode(HttpStatus.OK)
  async uploadDocument(
    @CurrentUser('id') userId: string,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.identityService.uploadDocument(
      userId,
      dto.verificationId,
      dto.documentType,
      dto.countryCode,
      dto.frontImageBase64,
      dto.backImageBase64,
    );
  }

  @Post('face/session')
  @HttpCode(HttpStatus.OK)
  async startFaceSession(
    @CurrentUser('id') userId: string,
    @Body('verificationId') verificationId: string,
  ) {
    return this.identityService.startFaceSession(userId, verificationId);
  }

  @Post('face/quality')
  @HttpCode(HttpStatus.OK)
  async checkQuality(@Body('imageBase64') imageBase64: string) {
    return this.identityService.checkFaceQuality(imageBase64);
  }

  @Post('face/verify')
  @HttpCode(HttpStatus.OK)
  async submitBiometrics(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitBiometricsDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.identityService.submitBiometrics(
      userId,
      dto.verificationId,
      dto.sessionId,
      dto.challengeType,
      dto.liveFrameBase64,
      dto.clientResponse,
      ipAddress,
      userAgent,
    );
  }

  @Get('status')
  async getStatus(@CurrentUser('id') userId: string) {
    return this.identityService.getStatus(userId);
  }

  @Post('retry')
  @HttpCode(HttpStatus.OK)
  async retry(@CurrentUser('id') userId: string) {
    return this.identityService.retryVerification(userId);
  }
}
