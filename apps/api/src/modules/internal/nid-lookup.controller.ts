import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { InternalApiKeyGuard } from './guards/internal-api-key.guard';
import { NidCheckDto } from './dto/nid-check.dto';
import { NidLookupResponse, NidLookupService } from './nid-lookup.service';

/**
 * Internal verified user identity & profile lookup endpoint — NOT for browsers.
 *
 * Auth:  Authorization: Bearer <INTERNAL_API_KEY>  (InternalApiKeyGuard)
 * Rate:  30 requests / minute per IP (overrides the global 100/min)
 * Body:  max 1 KB (enforced by the module-level middleware in internal.module.ts)
 *
 * This controller deliberately does NOT use JwtAuthGuard / user session guards.
 * Requests without the configured INTERNAL_API_KEY are rejected with 401.
 */
@Controller('internal')
@UseGuards(InternalApiKeyGuard)
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class NidLookupController {
  constructor(private readonly nidLookupService: NidLookupService) {}

  @Post('nid-lookup')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async lookupNid(
    @Body() dto: NidCheckDto,
    @Req() req: Request,
  ): Promise<NidLookupResponse> {
    const callerIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';

    return this.nidLookupService.lookup(dto.nid, dto.dob, callerIp);
  }
}
