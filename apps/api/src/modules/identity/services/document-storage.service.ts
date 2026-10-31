import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class DocumentStorageService {
  private readonly identityUploadsDir: string;
  private readonly businessUploadsDir: string;

  constructor() {
    const baseUploadDir = path.resolve(process.cwd(), 'uploads');
    this.identityUploadsDir = path.join(baseUploadDir, 'identity');
    this.businessUploadsDir = path.join(baseUploadDir, 'business');

    fs.mkdirSync(this.identityUploadsDir, { recursive: true });
    fs.mkdirSync(this.businessUploadsDir, { recursive: true });
  }

  saveBase64Document(
    base64Data: string,
    category: 'identity' | 'business',
    prefix: string = 'doc',
  ): { filePath: string; fileName: string; mimeType: string; sizeBytes: number } {
    if (!base64Data) {
      throw new BadRequestException('No document data provided');
    }

    let mimeType = 'image/jpeg';
    let rawBase64 = base64Data;

    if (base64Data.startsWith('data:')) {
      const match = base64Data.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        rawBase64 = match[2];
      }
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(`Unsupported file type: ${mimeType}. Allowed: JPEG, PNG, WEBP, PDF`);
    }

    const buffer = Buffer.from(rawBase64, 'base64');
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (buffer.length > maxSize) {
      throw new BadRequestException('File size exceeds the 10MB limit');
    }

    const ext = mimeType === 'application/pdf' ? 'pdf' : mimeType.split('/')[1] || 'jpg';
    const fileName = `${prefix}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const targetDir = category === 'identity' ? this.identityUploadsDir : this.businessUploadsDir;
    const fullPath = path.join(targetDir, fileName);

    fs.writeFileSync(fullPath, buffer);

    return {
      filePath: fullPath,
      fileName,
      mimeType,
      sizeBytes: buffer.length,
    };
  }

  computeDocumentHash(countryCode: string, documentType: string, documentNumber: string): string {
    const normalized = `${countryCode.toUpperCase().trim()}:${documentType.toUpperCase().trim()}:${documentNumber.toUpperCase().trim()}`;
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  readDocumentBase64(filePath: string): string | null {
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'base64');
      }
    } catch {
      // ignore
    }
    return null;
  }
}
