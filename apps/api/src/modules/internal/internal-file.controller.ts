import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { InternalApiKeyGuard } from './guards/internal-api-key.guard';
import {
  FileKind,
  InternalFileService,
  VALID_KINDS,
} from './internal-file.service';

/**
 * Internal file-serving endpoint — NOT for browsers.
 *
 * Auth:   Authorization: Bearer <INTERNAL_API_KEY>  (InternalApiKeyGuard)
 *         IP allowlist (INTERNAL_ALLOWED_IPS env var) optionally applied.
 * Rate:   60 requests / minute per IP (overrides the global 100/min).
 * No JWT / session guard is used — InternalApiKeyGuard is the sole gatekeeper.
 *
 * Kinds:
 *   document-front  → IdentityDocument front image delivered as PDF
 *   document-back   → IdentityDocument back  image delivered as PDF
 *   face-live       → FaceVerification live selfie (taken at registration)
 *   face-portrait   → FaceVerification portrait from the ID document
 *
 * Any unrecognised kind value is rejected with 404 (empty body).
 * Any path-traversal attempt or missing record is rejected with 404 (empty body).
 * File paths are NEVER exposed in responses or error messages.
 */
@Controller('internal')
@UseGuards(InternalApiKeyGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class InternalFileController {
  constructor(private readonly internalFileService: InternalFileService) {}

  @Get('files/:kind/:id')
  async serveFile(
    @Param('kind') kind: string,
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // Validate kind — reject anything not in the allowlist with 404
    if (!(VALID_KINDS as readonly string[]).includes(kind)) {
      throw new NotFoundException();
    }

    const callerIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';

    // Validate id: must be a non-empty UUID (36 chars) to avoid wasted DB hits
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      throw new NotFoundException();
    }

    const { buffer, mimeType, fileName } = await this.internalFileService.resolve(
      kind as FileKind,
      id,
      callerIp,
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-store',
    });

    res.send(buffer);
  }
}
