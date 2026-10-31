import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService, AuditEventType } from '../audit/audit.service';

import { EmailService } from '../email/email.service';

@Injectable()
export class MfaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {
    authenticator.options = {
      window: 1, // allow 1 step before/after for time drift
    };
  }

  /**
   * Generates a new TOTP secret, QR code, and 10 plain backup codes.
   */
  async generateMfaSecret(user: { id: string; email: string }) {
    const secret = authenticator.generateSecret();
    const appName = 'Central Account Platform';
    const otpAuthUrl = authenticator.keyuri(user.email, appName, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // Generate 10 random 10-character alphanumeric recovery codes
    const plainBackupCodes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(5).toString('hex').toUpperCase();
      plainBackupCodes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
    }

    return {
      secret,
      otpAuthUrl,
      qrCodeDataUrl,
      backupCodes: plainBackupCodes,
    };
  }

  /**
   * Verifies the submitted code and activates MFA for the user.
   */
  async enableMfa(
    userId: string,
    secret: string,
    code: string,
    plainBackupCodes: string[],
    ipAddress?: string,
    userAgent?: string,
  ) {
    const isValid = authenticator.check(code, secret);
    if (!isValid) {
      throw new BadRequestException('Invalid authentication code. Please try again.');
    }

    // Hash backup codes before persisting
    const hashedCodes: string[] = [];
    for (const bCode of plainBackupCodes) {
      const hashed = crypto.createHash('sha256').update(bCode).digest('hex');
      hashedCodes.push(hashed);
    }

    // Check if user already has an MFA record
    const existing = await this.prisma.mfaMethod.findFirst({
      where: { user_id: userId, type: 'TOTP' },
    });

    if (existing) {
      await this.prisma.mfaMethod.update({
        where: { id: existing.id },
        data: {
          secret,
          is_enabled: true,
          backup_codes: hashedCodes,
        },
      });
    } else {
      await this.prisma.mfaMethod.create({
        data: {
          user_id: userId,
          type: 'TOTP',
          secret,
          is_enabled: true,
          backup_codes: hashedCodes,
        },
      });
    }

    await this.auditService.logEvent({
      userId,
      eventType: AuditEventType.MFA_ENABLED,
      ipAddress,
      userAgent,
      metadata: { method: 'TOTP' },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (user?.email) {
      await this.emailService.sendMfaStatusEmail(user.email, true);
    }

    return { success: true, message: 'Two-factor authentication successfully enabled' };
  }

  /**
   * Disables MFA for the user.
   */
  async disableMfa(userId: string, ipAddress?: string, userAgent?: string) {
    const mfa = await this.prisma.mfaMethod.findFirst({
      where: { user_id: userId, type: 'TOTP', is_enabled: true },
    });

    if (!mfa) {
      throw new BadRequestException('MFA is not enabled for this account');
    }

    await this.prisma.mfaMethod.update({
      where: { id: mfa.id },
      data: { is_enabled: false },
    });

    await this.auditService.logEvent({
      userId,
      eventType: AuditEventType.MFA_DISABLED,
      ipAddress,
      userAgent,
      metadata: { method: 'TOTP' },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (user?.email) {
      await this.emailService.sendMfaStatusEmail(user.email, false);
    }

    return { success: true, message: 'Two-factor authentication disabled' };
  }

  /**
   * Validates code against active secret or backup codes.
   */
  async verifyTotpOrBackup(userId: string, code: string): Promise<boolean> {
    const mfa = await this.prisma.mfaMethod.findFirst({
      where: { user_id: userId, type: 'TOTP', is_enabled: true },
    });

    if (!mfa) {
      return false;
    }

    // 1. Check TOTP code
    const isTotpValid = authenticator.check(code, mfa.secret);
    if (isTotpValid) {
      return true;
    }

    // 2. Check backup code
    const hashedSubmitted = crypto.createHash('sha256').update(code).digest('hex');
    const codeIndex = mfa.backup_codes.indexOf(hashedSubmitted);

    if (codeIndex !== -1) {
      // Remove used backup code
      const updatedCodes = [...mfa.backup_codes];
      updatedCodes.splice(codeIndex, 1);
      await this.prisma.mfaMethod.update({
        where: { id: mfa.id },
        data: { backup_codes: updatedCodes },
      });
      return true;
    }

    return false;
  }

  async getMfaStatus(userId: string) {
    const mfa = await this.prisma.mfaMethod.findFirst({
      where: { user_id: userId, is_enabled: true },
    });

    return {
      isEnabled: !!mfa,
      type: mfa?.type || null,
      remainingBackupCodes: mfa ? mfa.backup_codes.length : 0,
    };
  }
}
