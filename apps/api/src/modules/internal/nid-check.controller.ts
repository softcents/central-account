import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { InternalApiKeyGuard } from './guards/internal-api-key.guard';
import { NidCheckDto } from './dto/nid-check.dto';
import { NidCheckService } from './nid-check.service';

/**
 * Internal NID verification endpoint — NOT for browsers.
 *
 * Auth:  Authorization: Bearer <INTERNAL_API_KEY>  (InternalApiKeyGuard)
 * Rate:  30 requests / minute per IP (overrides the global 100/min)
 * Body:  max 1 KB (enforced by the module-level middleware in internal.module.ts)
 *
 * This controller deliberately does NOT use JwtAuthGuard / session guards.
 * A normal user JWT will be rejected by InternalApiKeyGuard because it is
 * not the configured INTERNAL_API_KEY value.
 */
@Controller('internal')
@UseGuards(InternalApiKeyGuard)
// Override the global 100/min throttle to 30/min for this route.
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class NidCheckController {
  constructor(private readonly nidCheckService: NidCheckService) {}

  @Post('nid-check')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async checkNid(
    @Body() dto: NidCheckDto,
    @Req() req: Request,
  ): Promise<{ match: boolean }> {
    const callerIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';

    return this.nidCheckService.check(dto.nid, dto.dob, callerIp);
  }
}
