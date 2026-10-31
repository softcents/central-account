import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * The four file kinds exposed by GET /api/internal/files/:kind/:id.
 *
 *   document-front  → IdentityDocument.front_image_path   (id = document id)
 *   document-back   → IdentityDocument.back_image_path    (id = document id)
 *   face-live       → FaceVerification.live_face_image_path (id = face-verification id)
 *   face-portrait   → FaceVerification.portrait_image_path  (id = face-verification id)
 */
export const VALID_KINDS = [
  'document-front',
  'document-back',
  'face-live',
  'face-portrait',
] as const;

export type FileKind = (typeof VALID_KINDS)[number];

export interface ResolvedFile {
  /** Raw bytes to send to the client */
  buffer: Buffer;
  /** MIME type for Content-Type header */
  mimeType: string;
  /** Basename for Content-Disposition */
  fileName: string;
}

@Injectable()
export class InternalFileService {
  private readonly logger = new Logger(InternalFileService.name);

  /**
   * Absolute path to the uploads root.  Files MUST resolve within this tree.
   * DocumentStorageService uses the same derivation:
   *   path.resolve(process.cwd(), 'uploads')
   */
  private readonly uploadsRoot: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.uploadsRoot = path.resolve(process.cwd(), 'uploads');
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Resolves the file for the given (kind, id) pair, enforces path-traversal
   * protection, and returns bytes ready to stream to the caller.
   *
   * Logs only: timestamp, callerIp, kind, found/not-found.  Never logs paths.
   *
   * - Document kinds  → image is re-encoded into a minimal single-page PDF.
   * - Face kinds      → image bytes are returned as-is (JPEG / PNG).
   */
  async resolve(
    kind: FileKind,
    id: string,
    callerIp: string,
  ): Promise<ResolvedFile> {
    const ts = new Date().toISOString();

    const filePath = await this.lookupFilePath(kind, id);

    if (!filePath) {
      this.logger.log(
        `[InternalFile] ${ts} | ip=${callerIp} | kind=${kind} | found=false [db-null]`,
      );
      throw new NotFoundException();
    }

    // ── Path-traversal guard ──────────────────────────────────────────────
    const resolved = path.resolve(filePath);
    const uploadsRootWithSep = this.uploadsRoot + path.sep;
    if (!resolved.startsWith(uploadsRootWithSep) && resolved !== this.uploadsRoot) {
      // Resolved path is outside the uploads tree — reject silently with 404
      this.logger.warn(
        `[InternalFile] ${ts} | ip=${callerIp} | kind=${kind} | found=false [traversal-rejected]`,
      );
      throw new NotFoundException();
    }

    if (!fs.existsSync(resolved)) {
      this.logger.log(
        `[InternalFile] ${ts} | ip=${callerIp} | kind=${kind} | found=false [not-on-disk]`,
      );
      throw new NotFoundException();
    }

    const rawBytes = fs.readFileSync(resolved);
    const sourceMime = this.detectMime(resolved);

    let buffer: Buffer;
    let mimeType: string;
    let fileName: string;

    if (kind === 'document-front' || kind === 'document-back') {
      // Documents are always delivered as PDF regardless of the stored format.
      // This converts the image (JPEG / PNG / WebP / or an already-stored PDF)
      // into a single-page PDF using only Node.js built-in primitives.
      buffer = this.wrapImageAsPdf(rawBytes, sourceMime, id, kind);
      mimeType = 'application/pdf';
      fileName = `${kind}-${id}.pdf`;
    } else {
      // Face images are delivered in their original format.
      buffer = rawBytes;
      mimeType = sourceMime;
      fileName = `${kind}-${id}${path.extname(resolved) || '.jpg'}`;
    }

    this.logger.log(
      `[InternalFile] ${ts} | ip=${callerIp} | kind=${kind} | found=true`,
    );

    return { buffer, mimeType, fileName };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Returns the raw filesystem path stored in the DB for the given (kind, id).
   * Returns null if the record doesn't exist or the field is null/empty.
   */
  private async lookupFilePath(
    kind: FileKind,
    id: string,
  ): Promise<string | null> {
    if (kind === 'document-front' || kind === 'document-back') {
      const doc = await this.prisma.identityDocument.findUnique({
        where: { id },
        select: { front_image_path: true, back_image_path: true },
      });
      if (!doc) return null;
      return kind === 'document-front'
        ? (doc.front_image_path ?? null)
        : (doc.back_image_path ?? null);
    }

    // face-live | face-portrait
    const fv = await this.prisma.faceVerification.findUnique({
      where: { id },
      select: { live_face_image_path: true, portrait_image_path: true },
    });
    if (!fv) return null;
    return kind === 'face-live'
      ? (fv.live_face_image_path ?? null)
      : (fv.portrait_image_path ?? null);
  }

  /**
   * Derives the MIME type from the file extension, defaulting to image/jpeg.
   */
  private detectMime(filePath: string): string {
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
    };
    return mimeMap[path.extname(filePath).toLowerCase()] ?? 'image/jpeg';
  }

  /**
   * Wraps an image buffer inside a minimal but spec-valid PDF 1.4 document.
   *
   * Supports:
   *   - JPEG  → embedded as DCTDecode (native PDF image codec, lossless re-use)
   *   - PNG / WebP → embedded as ASCIIHexDecode stream (universally supported)
   *   - PDF  → returned as-is (already a PDF)
   *
   * All done with plain Buffer / string operations — no external libraries.
   *
   * A4 page (595 x 842 pt).  The image is scaled to fill the page while
   * maintaining its aspect ratio.  Width / height are parsed from JPEG SOF /
   * PNG IHDR markers; for WebP / unknown formats A4 fill is used.
   */
  private wrapImageAsPdf(
    imageBytes: Buffer,
    sourceMime: string,
    id: string,
    kind: string,
  ): Buffer {
    // If the stored file is already a PDF, return it unchanged.
    if (sourceMime === 'application/pdf') {
      return imageBytes;
    }

    const A4_W = 595; // points
    const A4_H = 842;

    // Try to read pixel dimensions for proper aspect-ratio scaling.
    let imgW = A4_W;
    let imgH = A4_H;

    if (sourceMime === 'image/jpeg') {
      const dims = this.readJpegDimensions(imageBytes);
      if (dims) {
        imgW = dims.width;
        imgH = dims.height;
      }
    } else if (sourceMime === 'image/png') {
      const dims = this.readPngDimensions(imageBytes);
      if (dims) {
        imgW = dims.width;
        imgH = dims.height;
      }
    }
    // WebP — dimension parsing omitted; falls back to A4 fill.

    // Scale image to fit inside A4 with 20 pt margins.
    const MARGIN = 20;
    const maxW = A4_W - MARGIN * 2;
    const maxH = A4_H - MARGIN * 2;
    const scale = Math.min(maxW / imgW, maxH / imgH);
    const drawW = Math.round(imgW * scale);
    const drawH = Math.round(imgH * scale);
    const drawX = Math.round((A4_W - drawW) / 2);
    const drawY = Math.round((A4_H - drawH) / 2);

    // JPEG → DCTDecode (native PDF image codec, lossless re-use)
    // Everything else → ASCIIHexDecode (universally supported)
    const isJpeg = sourceMime === 'image/jpeg';

    let imageStreamBytes: Buffer;
    let filterName: string;

    if (isJpeg) {
      imageStreamBytes = imageBytes;
      filterName = 'DCTDecode';
    } else {
      // Encode as ASCII hex terminated with '>'
      const hexStr = imageBytes.toString('hex').toUpperCase() + '>';
      imageStreamBytes = Buffer.from(hexStr, 'ascii');
      filterName = 'ASCIIHexDecode';
    }

    // Build PDF objects as Buffer parts, track byte offsets for xref table.
    // Object numbering:
    //   1  Catalog
    //   2  Pages
    //   3  Page
    //   4  Image XObject
    //   5  Content stream
    const parts: Buffer[] = [];
    const offsets: number[] = [0, 0, 0, 0, 0, 0]; // 1-indexed; slot 0 unused
    let pos = 0;

    const push = (s: string | Buffer): void => {
      const buf = typeof s === 'string' ? Buffer.from(s, 'latin1') : s;
      parts.push(buf);
      pos += buf.length;
    };

    // Header
    push('%PDF-1.4\n');
    push('%\xff\xff\xff\xff\n'); // mark as binary

    // Obj 1 – Catalog
    offsets[1] = pos;
    push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    // Obj 2 – Pages
    offsets[2] = pos;
    push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

    // Obj 3 – Page
    offsets[3] = pos;
    push(
      `3 0 obj\n` +
        `<< /Type /Page\n` +
        `   /Parent 2 0 R\n` +
        `   /MediaBox [0 0 ${A4_W} ${A4_H}]\n` +
        `   /Resources << /XObject << /Img 4 0 R >> >>\n` +
        `   /Contents 5 0 R\n` +
        `>>\nendobj\n`,
    );

    // Obj 4 – Image XObject
    offsets[4] = pos;
    push(
      `4 0 obj\n` +
        `<< /Type /XObject\n` +
        `   /Subtype /Image\n` +
        `   /Width ${imgW}\n` +
        `   /Height ${imgH}\n` +
        `   /ColorSpace /DeviceRGB\n` +
        `   /BitsPerComponent 8\n` +
        `   /Filter /${filterName}\n` +
        `   /Length ${imageStreamBytes.length}\n` +
        `>>\n` +
        `stream\n`,
    );
    push(imageStreamBytes);
    push('\nendstream\nendobj\n');

    // Obj 5 – Page content stream
    const contentStr =
      `q\n${drawW} 0 0 ${drawH} ${drawX} ${drawY} cm\n/Img Do\nQ\n`;
    offsets[5] = pos;
    push(
      `5 0 obj\n` +
        `<< /Length ${contentStr.length} >>\n` +
        `stream\n` +
        contentStr +
        `endstream\nendobj\n`,
    );

    // Cross-reference table
    const xrefOffset = pos;
    push(`xref\n0 6\n`);
    push(`0000000000 65535 f \n`);
    for (let i = 1; i <= 5; i++) {
      push(`${offsets[i].toString().padStart(10, '0')} 00000 n \n`);
    }

    // Trailer
    const title = `NID Document ${kind} ${id}`;
    push(
      `trailer\n` +
        `<< /Size 6\n` +
        `   /Root 1 0 R\n` +
        `   /Info << /Title (${title}) /Producer (CentralAccount) >>\n` +
        `>>\n` +
        `startxref\n` +
        `${xrefOffset}\n` +
        `%%EOF\n`,
    );

    return Buffer.concat(parts);
  }

  /**
   * Reads pixel width & height from a JPEG stream by scanning for SOF markers.
   * Returns null on any parse error.
   */
  private readJpegDimensions(
    buf: Buffer,
  ): { width: number; height: number } | null {
    try {
      let i = 2; // skip FF D8 SOI
      while (i < buf.length - 8) {
        if (buf[i] !== 0xff) return null;
        const marker = buf[i + 1];
        const segLen = buf.readUInt16BE(i + 2);
        // SOF0 (0xc0), SOF1 (0xc1), SOF2 (0xc2) carry width & height
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
          const height = buf.readUInt16BE(i + 5);
          const width = buf.readUInt16BE(i + 7);
          return { width, height };
        }
        i += 2 + segLen;
      }
    } catch {
      // Ignore parse errors — caller falls back to A4 fill
    }
    return null;
  }

  /**
   * Reads pixel width & height from a PNG stream (IHDR chunk at bytes 16-23).
   * Returns null on any parse error.
   */
  private readPngDimensions(
    buf: Buffer,
  ): { width: number; height: number } | null {
    try {
      if (buf.length < 24) return null;
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      return { width, height };
    } catch {
      return null;
    }
  }
}
