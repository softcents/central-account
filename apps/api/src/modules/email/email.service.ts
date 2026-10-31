import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface LoginAlertDetails {
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

export interface SecurityAlertDetails {
  alertType: string;
  message: string;
  ipAddress?: string;
  timestamp?: Date;
}

export interface KycStatusDetails {
  status: string;
  level?: string;
  rejectionReasons?: string[];
}

export interface KybStatusDetails {
  businessName: string;
  status: string;
  notes?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<number | string>('SMTP_PORT', 587));
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.fromAddress = this.configService.get<string>(
      'SMTP_FROM',
      '"Central Account" <meghnapaybd@gmail.com>',
    );

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      this.logger.log(`[EmailService] SMTP transporter configured with host ${host}:${port} for ${user}`);
    } else {
      this.logger.warn('[EmailService] SMTP credentials not provided. Emails will only be logged.');
    }
  }

  private renderBaseTemplate(title: string, contentHtml: string): string {
    const currentYear = new Date().getFullYear();
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 36px 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .brand { display: flex; align-items: center; margin-bottom: 24px; }
          .brand-badge { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; font-weight: 700; font-size: 14px; padding: 6px 14px; border-radius: 8px; display: inline-block; letter-spacing: 0.5px; }
          h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 16px; margin-bottom: 12px; }
          p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 12px 0; }
          .highlight-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 13px; color: #cbd5e1; }
          .highlight-card p { margin: 6px 0; }
          .highlight-card strong { color: #f8fafc; }
          .btn-container { text-align: center; margin: 30px 0; }
          .btn { background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4); }
          .btn:hover { background: #4338ca; }
          .raw-link { background: #0b0f19; border: 1px solid #1f2937; border-radius: 8px; padding: 12px; font-size: 12px; word-break: break-all; color: #818cf8; margin-top: 16px; font-family: monospace; }
          .alert-banner { padding: 12px 16px; border-radius: 8px; margin: 16px 0; font-size: 13px; font-weight: 500; }
          .alert-warning { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24; }
          .alert-success { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; }
          .alert-danger { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; }
          .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #1f2937; font-size: 12px; color: #64748b; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">
            <span class="brand-badge">Central Account</span>
          </div>
          ${contentHtml}
          <div class="footer">
            <p>&bull; This is an automated security communication from Central Account Platform.</p>
            <p>&bull; If you did not initiate this action or suspect unauthorized access, please lock your account or contact support immediately.</p>
            <p>&copy; ${currentYear} Central Account Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async sendMail(to: string, subject: string, html: string, text: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`[EmailService] Simulated send to ${to} (no SMTP transporter configured). Subject: "${subject}"`);
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        text,
        html,
      });

      this.logger.log(`[EmailService] Email sent to ${to} | Subject: "${subject}" | MessageId: ${info.messageId}`);
      return true;
    } catch (err: any) {
      this.logger.error(`[EmailService] Failed to send email to ${to} ("${subject}"): ${err.message}`, err.stack);
      return false;
    }
  }

  public async sendDirectMail(to: string, subject: string, html: string, text: string): Promise<boolean> {
    return this.sendMail(to, subject, html, text);
  }

  /**
   * 1. Account Verification / Registration
   */
  async sendVerificationEmail(toEmail: string, verificationUrl: string): Promise<boolean> {
    const subject = 'Verify your Central Account account';
    const content = `
      <h1>Verify your email address</h1>
      <p>Hello,</p>
      <p>Thank you for creating an account with Central Account. To activate your account and access identity proofing, please verify your email address by clicking the button below:</p>
      <div class="btn-container">
        <a href="${verificationUrl}" class="btn" target="_blank">Verify Email Address</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <div class="raw-link">${verificationUrl}</div>
      <p style="margin-top: 20px; font-size: 12px; color: #64748b;">This verification link will expire in 24 hours.</p>
    `;
    const text = `Verify your Central Account account\n\nPlease click the link below to verify your email:\n${verificationUrl}\n\nValid for 24 hours.`;
    return this.sendMail(toEmail, subject, this.renderBaseTemplate(subject, content), text);
  }

  /**
   * 2. Account Created / Welcome
   */
  async sendAccountCreatedEmail(toEmail: string, firstName?: string): Promise<boolean> {
    const subject = 'Welcome to Central Account Platform';
    const name = firstName || 'User';
    const content = `
      <h1>Welcome, ${name}!</h1>
      <div class="alert-banner alert-success">Your Central Account account has been successfully created.</div>
      <p>You can now manage your personal identity proofs, access business credentials, and authenticate seamlessly across connected third-party applications with single sign-on.</p>
      <div class="highlight-card">
        <p><strong>Primary Email:</strong> ${toEmail}</p>
        <p><strong>Security Tip:</strong> We recommend enabling Two-Factor Authentication (TOTP) from your account security dashboard right away.</p>
      </div>
    `;
    const text = `Welcome to Central Account, ${name}!\n\nYour account has been created with email ${toEmail}.\nWe recommend enabling 2FA for enhanced protection.`;
    return this.sendMail(toEmail, subject, this.renderBaseTemplate(subject, content), text);
  }

  /**
   * 3. Login Alert (New Device / IP)
   */
  async sendLoginAlertEmail(toEmail: string, details: LoginAlertDetails): Promise<boolean> {
    const subject = 'Security Alert: New Sign-in to your Central Account Account';
    const timeStr = (details.timestamp || new Date()).toUTCString();
    const content = `
      <h1>New sign-in detected</h1>
      <p>We detected a successful sign-in to your Central Account account:</p>
      <div class="highlight-card">
        <p><strong>Date & Time:</strong> ${timeStr}</p>
        <p><strong>IP Address:</strong> ${details.ipAddress || 'Unknown'}</p>
        <p><strong>Device / Browser:</strong> ${details.userAgent || 'Unknown client'}</p>
      </div>
      <div class="alert-banner alert-warning">
        If this was you, no action is needed. If you did not sign in, someone else may have accessed your account. Revoke all active sessions and change your password immediately.
      </div>
    `;
    const text = `Security Alert: New Sign-in\n\nSign-in detected at ${timeStr} from IP ${details.ipAddress || 'Unknown'}.\nIf this wasn't you, reset your password and revoke sessions immediately.`;
    return this.sendMail(toEmail, subject, this.renderBaseTemplate(subject, content), text);
  }

  /**
   * 4. Password Changed
   */
  async sendPasswordChangedEmail(toEmail: string, ipAddress?: string): Promise<boolean> {
    const subject = 'Your Central Account password has been changed';
    const timeStr = new Date().toUTCString();
    const content = `
      <h1>Password successfully changed</h1>
      <div class="alert-banner alert-success">Your account password was updated on ${timeStr}.</div>
      <p>All active sessions have been updated. If you did not make this change, please contact support and recover your account immediately.</p>
      ${ipAddress ? `<p style="font-size: 12px; color: #64748b;">Request origin: ${ipAddress}</p>` : ''}
    `;
    const text = `Your Central Account password was changed on ${timeStr}.\nIf you did not do this, please contact support immediately.`;
    return this.sendMail(toEmail, subject, this.renderBaseTemplate(subject, content), text);
  }

  /**
   * 5. MFA Status Updates
   */
  async sendMfaStatusEmail(toEmail: string, enabled: boolean): Promise<boolean> {
    const subject = `Two-Factor Authentication ${enabled ? 'Enabled' : 'Disabled'}`;
    const statusText = enabled ? 'ENABLED' : 'DISABLED';
    const alertClass = enabled ? 'alert-success' : 'alert-danger';
    const content = `
      <h1>Two-Factor Authentication (MFA) ${statusText}</h1>
      <div class="alert-banner ${alertClass}">
        Two-Factor Authentication was ${statusText.toLowerCase()} on your account on ${new Date().toUTCString()}.
      </div>
      ${
        enabled
          ? '<p>Your account is now protected with time-based one-time passcodes (TOTP). You will be required to provide a code on future logins.</p>'
          : '<p style="color: #f87171;">Your account is now less secure without 2FA protection. If you did not authorize this change, please re-enable MFA and update your credentials immediately.</p>'
      }
    `;
    const text = `Two-Factor Authentication ${statusText}\n\n2FA was ${statusText.toLowerCase()} on ${new Date().toUTCString()}.\nIf you did not make this change, contact support immediately.`;
    return this.sendMail(toEmail, subject, this.renderBaseTemplate(subject, content), text);
  }

  /**
   * 6. KYC Status Updates
   */
  async sendKycStatusEmail(toEmail: string, details: KycStatusDetails): Promise<boolean> {
    const subject = `Identity Verification Update: ${details.status}`;
    let bannerClass = 'alert-warning';
    let description = '';

    if (details.status === 'VERIFIED') {
      bannerClass = 'alert-success';
      description = `Congratulations! Your identity has been verified at Level: ${details.level || 'LEVEL_2'}. Your account now has access to higher tier privileges and business authorizations.`;
    } else if (details.status === 'REJECTED') {
      bannerClass = 'alert-danger';
      description = `Your identity verification submission could not be approved. Reason: ${
        details.rejectionReasons?.join(', ') || 'Document or biometric quality does not meet compliance requirements.'
      }`;
    } else if (details.status === 'PROCESSING' || details.status === 'REVIEW_REQUIRED') {
      bannerClass = 'alert-warning';
      description = 'Your identity documents and biometric verification have been received and are currently undergoing compliance review.';
    } else {
      description = `Your identity verification status has updated to: ${details.status}.`;
    }

    const content = `
      <h1>Identity Verification: ${details.status}</h1>
      <div class="alert-banner ${bannerClass}">Status: ${details.status}</div>
      <p>${description}</p>
      ${
        details.level
          ? `<div class="highlight-card"><p><strong>Current Verification Level:</strong> ${details.level}</p></div>`
          : ''
      }
    `;
    const text = `Identity Verification: ${details.status}\n\n${description}`;
    return this.sendMail(toEmail, subject, this.renderBaseTemplate(subject, content), text);
  }

  /**
   * 7. KYB Status Updates
   */
  async sendKybStatusEmail(toEmail: string, details: KybStatusDetails): Promise<boolean> {
    const subject = `Business Verification Update: ${details.businessName} (${details.status})`;
    let bannerClass = 'alert-warning';
    if (details.status === 'VERIFIED') bannerClass = 'alert-success';
    if (details.status === 'REJECTED') bannerClass = 'alert-danger';

    const content = `
      <h1>Business Verification: ${details.businessName}</h1>
      <div class="alert-banner ${bannerClass}">Status: ${details.status}</div>
      <p>The business entity verification for <strong>${details.businessName}</strong> has been updated to <strong>${details.status}</strong>.</p>
      ${details.notes ? `<div class="highlight-card"><p><strong>Compliance Notes:</strong> ${details.notes}</p></div>` : ''}
    `;
    const text = `Business Verification: ${details.businessName}\nStatus: ${details.status}\nNotes: ${details.notes || 'None'}`;
    return this.sendMail(toEmail, subject, this.renderBaseTemplate(subject, content), text);
  }

  /**
   * 8. Email Change Lifecycle: Request Alert to Old Email
   */
  async sendEmailChangeRequestedEmail(oldEmail: string, newEmail: string, ticketId: string): Promise<boolean> {
    const subject = 'Security Notice: Email change requested for your account';
    const content = `
      <h1>Email change requested</h1>
      <div class="alert-banner alert-warning">A request was submitted to change your account email to: <strong>${newEmail}</strong></div>
      <p>This request has initiated an internal compliance security review under Support Ticket <code>#${ticketId}</code>.</p>
      <div class="highlight-card">
        <p><strong>Current Email:</strong> ${oldEmail}</p>
        <p><strong>Requested New Email:</strong> ${newEmail}</p>
        <p><strong>Status:</strong> Under Identity & Compliance Review</p>
      </div>
      <p style="color: #f87171; font-size: 13px;">
        <strong>Warning:</strong> If you did NOT request this email change, your account credentials may be compromised. Please sign in immediately, revoke all active sessions, and contact support.
      </p>
    `;
    const text = `Security Notice: Email change requested\n\nA request to change your email from ${oldEmail} to ${newEmail} was filed under Ticket #${ticketId}.\nIf you did not request this, contact support immediately.`;
    return this.sendMail(oldEmail, subject, this.renderBaseTemplate(subject, content), text);
  }

  /**
   * 9. Email Change Lifecycle: Verification to New Email
   */
  async sendEmailChangeVerificationEmail(newEmail: string, verificationUrl: string): Promise<boolean> {
    const subject = 'Confirm your new email address for Central Account';
    const content = `
      <h1>Confirm your new email address</h1>
      <p>Your email change request has been reviewed and approved by compliance. To complete the transfer and update your primary email address, click the confirmation button below:</p>
      <div class="btn-container">
        <a href="${verificationUrl}" class="btn" target="_blank">Confirm Email Change</a>
      </div>
      <p>Or paste this link into your browser:</p>
      <div class="raw-link">${verificationUrl}</div>
      <p style="margin-top: 20px; font-size: 12px; color: #64748b;">This signed confirmation link is valid for 24 hours.</p>
    `;
    const text = `Confirm your new email address\n\nPlease click the link below to confirm:\n${verificationUrl}\n\nValid for 24 hours.`;
    return this.sendMail(newEmail, subject, this.renderBaseTemplate(subject, content), text);
  }

  /**
   * 10. Email Change Lifecycle: Confirmation of completion
   */
  async sendEmailChangedNotificationEmail(oldEmail: string, newEmail: string): Promise<boolean> {
    const subject = 'Your Central Account primary email has been updated';
    const content = `
      <h1>Primary Email Address Changed</h1>
      <div class="alert-banner alert-success">Your email address update is now complete.</div>
      <div class="highlight-card">
        <p><strong>Previous Address:</strong> ${oldEmail}</p>
        <p><strong>New Active Address:</strong> ${newEmail}</p>
        <p><strong>Date:</strong> ${new Date().toUTCString()}</p>
      </div>
      <p>As a security precaution, all existing sessions across other devices have been invalidated.</p>
    `;
    const text = `Your Central Account primary email has been updated to ${newEmail}.\nAll other active sessions have been invalidated for your security.`;
    // Send to both old and new addresses for complete audit transparency
    await this.sendMail(oldEmail, subject, this.renderBaseTemplate(subject, content), text);
    return this.sendMail(newEmail, subject, this.renderBaseTemplate(subject, content), text);
  }

  /**
   * 11. Security Alert (Lockouts, Session Revocation)
   */
  async sendSecurityAlertEmail(toEmail: string, details: SecurityAlertDetails): Promise<boolean> {
    const subject = `Security Alert: ${details.alertType}`;
    const content = `
      <h1>Security Alert: ${details.alertType}</h1>
      <div class="alert-banner alert-danger">${details.message}</div>
      <div class="highlight-card">
        <p><strong>Timestamp:</strong> ${(details.timestamp || new Date()).toUTCString()}</p>
        ${details.ipAddress ? `<p><strong>IP Address:</strong> ${details.ipAddress}</p>` : ''}
      </div>
      <p>If you need assistance regaining access or verifying account integrity, please contact support.</p>
    `;
    const text = `Security Alert: ${details.alertType}\n\n${details.message}\nTime: ${(details.timestamp || new Date()).toUTCString()}`;
    return this.sendMail(toEmail, subject, this.renderBaseTemplate(subject, content), text);
  }

  /**
   * 12. Organization Member Invitation
   */
  async sendOrganizationInviteEmail(details: {
    toEmail: string;
    orgName: string;
    orgId: string;
    role: string;
    inviterName?: string;
    inviterEmail: string;
    isExistingUser: boolean;
  }): Promise<boolean> {
    const subject = `You've been invited to join ${details.orgName} on Central Account`;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const actionUrl = `${frontendUrl}/organizations/${details.orgId}`;
    const inviterDisplay = details.inviterName || details.inviterEmail;

    const content = `
      <h1>Organization Team Invitation</h1>
      <div class="alert-banner alert-success">
        You have been invited to join <strong>${details.orgName}</strong>!
      </div>
      <p>Hello,</p>
      <p><strong>${inviterDisplay}</strong> (${details.inviterEmail}) has invited you to collaborate as a team member in the organization <strong>${details.orgName}</strong> on Central Account Platform.</p>
      
      <div class="highlight-card">
        <p><strong>Organization:</strong> ${details.orgName}</p>
        <p><strong>Assigned Role:</strong> <span style="color: #818cf8; font-weight: 600;">${details.role}</span></p>
        <p><strong>Invited By:</strong> ${inviterDisplay} (${details.inviterEmail})</p>
        <p><strong>Access Privileges:</strong> Delegated organization access according to your assigned role.</p>
      </div>

      <p>
        ${
          details.isExistingUser
            ? 'Since you already have a Central Account account registered with this email, simply log in to your account and open your organization workspace immediately:'
            : 'A Central Account account has been provisioned for this email. Click the button below to sign in and access your team workspace:'
        }
      </p>

      <div class="btn-container">
        <a href="${actionUrl}" class="btn" target="_blank">Access Organization Workspace</a>
      </div>

      <p>Or paste this link into your browser:</p>
      <div class="raw-link">${actionUrl}</div>

      <p style="margin-top: 24px; font-size: 12px; color: #64748b;">
        If you were not expecting this invitation, you can safely disregard this email or reach out to the organization owner.
      </p>
    `;

    const text = `You've been invited to join ${details.orgName} on Central Account\n\nInvited by: ${inviterDisplay} (${details.inviterEmail})\nRole: ${details.role}\n\nAccess your organization workspace here:\n${actionUrl}\n\nIf you already have an account, simply sign in.`;

    return this.sendMail(details.toEmail, subject, this.renderBaseTemplate(subject, content), text);
  }
}
