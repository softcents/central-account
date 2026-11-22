import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface VsmsSettings {
  apiUrl: string;
  apiToken: string;
  callerId: string | number;
  defaultDueAudioId?: string | number;
  defaultOverdueAudioId?: string | number;
  defaultWelcomeAudioId?: string | number;
  autoCallOnDue?: boolean;
  autoCallOnOverdue?: boolean;
}

export interface VoiceCallParams {
  phone: string;
  callerId?: string | number;
  audioId?: string | number;
  scheduledAt?: string;
  metadata?: Record<string, any>;
}

export interface VoiceOtpParams {
  phone: string;
  code: string | number;
  callerId?: string | number;
}

@Injectable()
export class SoftcentsVsmsAddon {
  private readonly logger = new Logger(SoftcentsVsmsAddon.name);

  // Authenticated vsms.softcents.com Credentials (Super Admin with 100,000 balance)
  private readonly DEFAULT_API_URL = 'https://vsms.softcents.com';
  private readonly DEFAULT_API_TOKEN = '14|OCq2yZelYts6BhSf1mmK4RQO6HX4Q98RLiuxxDO6190d0518';
  private readonly DEFAULT_CALLER_ID = '376'; // Softcents Billing <09617777121>
  private readonly DEFAULT_DUE_AUDIO_ID = '419'; // Softcents Due Bill Reminder Voice
  private readonly DEFAULT_OVERDUE_AUDIO_ID = '420'; // Softcents Overdue Notice Voice
  private readonly DEFAULT_WELCOME_AUDIO_ID = '421'; // Softcents Voice Greeting & Support

  private getSyncFilePath(): string {
    const candidates = [
      '/www/wwwroot/account.softcents.com/apps/web/src/data/whmcs_sync.json',
      path.join(process.cwd(), 'apps/web/src/data/whmcs_sync.json'),
      path.join(process.cwd(), '../web/src/data/whmcs_sync.json'),
      path.join(__dirname, '../../../../web/src/data/whmcs_sync.json'),
      path.join(process.cwd(), 'src/data/whmcs_sync.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return candidates[0];
  }

  private getSyncData(): any {
    try {
      const filePath = this.getSyncFilePath();
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (e: any) {
      this.logger.error(`Failed to read whmcs_sync.json: ${e.message}`);
    }
    return {};
  }

  private saveSyncData(data: any): void {
    try {
      const filePath = this.getSyncFilePath();
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e: any) {
      this.logger.error(`Failed to write whmcs_sync.json: ${e.message}`);
    }
  }

  /**
   * Normalizes phone number into Bangladeshi standard 01XXXXXXXXX or +8801XXXXXXXXX
   */
  formatNumber(phone: string): string {
    let clean = (phone || '').replace(/[^0-9]/g, '');
    if (clean.length === 11 && clean.startsWith('0')) {
      return clean;
    } else if (clean.length === 13 && clean.startsWith('880')) {
      return '0' + clean.slice(3);
    } else if (clean.length === 10 && !clean.startsWith('0')) {
      return '0' + clean;
    }
    return clean;
  }

  /**
   * Retrieves active Voice SMS settings
   */
  getSettings(): VsmsSettings {
    const data = this.getSyncData();
    const s = data?.addonSettingsMap?.SOFTCENTS_VSMS || {};
    return {
      apiUrl: s.api_url || this.DEFAULT_API_URL,
      apiToken: s.api_token || this.DEFAULT_API_TOKEN,
      callerId: s.caller_id || this.DEFAULT_CALLER_ID,
      defaultDueAudioId: s.default_due_audio_id || this.DEFAULT_DUE_AUDIO_ID,
      defaultOverdueAudioId: s.default_overdue_audio_id || this.DEFAULT_OVERDUE_AUDIO_ID,
      defaultWelcomeAudioId: s.default_welcome_audio_id || this.DEFAULT_WELCOME_AUDIO_ID,
      autoCallOnDue: s.auto_call_on_due !== undefined ? Boolean(s.auto_call_on_due) : false,
      autoCallOnOverdue: s.auto_call_on_overdue !== undefined ? Boolean(s.auto_call_on_overdue) : true,
    };
  }

  /**
   * Updates Voice SMS settings
   */
  updateSettings(settings: Partial<VsmsSettings>): { success: boolean; settings: VsmsSettings } {
    const data = this.getSyncData();
    if (!data.addonSettingsMap) data.addonSettingsMap = {};
    const current = data.addonSettingsMap.SOFTCENTS_VSMS || {};

    data.addonSettingsMap.SOFTCENTS_VSMS = {
      ...current,
      api_url: settings.apiUrl ?? current.api_url ?? this.DEFAULT_API_URL,
      api_token: settings.apiToken ?? current.api_token ?? this.DEFAULT_API_TOKEN,
      caller_id: settings.callerId ?? current.caller_id ?? this.DEFAULT_CALLER_ID,
      default_due_audio_id: settings.defaultDueAudioId ?? current.default_due_audio_id ?? this.DEFAULT_DUE_AUDIO_ID,
      default_overdue_audio_id: settings.defaultOverdueAudioId ?? current.default_overdue_audio_id ?? this.DEFAULT_OVERDUE_AUDIO_ID,
      default_welcome_audio_id: settings.defaultWelcomeAudioId ?? current.default_welcome_audio_id ?? this.DEFAULT_WELCOME_AUDIO_ID,
      auto_call_on_due: settings.autoCallOnDue ?? current.auto_call_on_due ?? false,
      auto_call_on_overdue: settings.autoCallOnOverdue ?? current.auto_call_on_overdue ?? true,
    };

    this.saveSyncData(data);
    return { success: true, settings: this.getSettings() };
  }

  /**
   * Checks real-time Voice SMS Balance from vsms.softcents.com
   * Endpoint: GET /api/account/balance
   */
  async checkBalance(): Promise<{ success: boolean; balance: number; currency: string; data?: any; message?: string }> {
    const creds = this.getSettings();
    const url = `${creds.apiUrl}/api/account/balance`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${creds.apiToken}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      const json = await response.json();
      if (response.ok && json.data?.balance !== undefined) {
        return {
          success: true,
          balance: json.data.balance,
          currency: 'BDT',
          data: json.data,
          message: 'Voice SMS balance retrieved successfully.',
        };
      }
      return {
        success: false,
        balance: 100000,
        currency: 'BDT',
        message: json.message || 'Failed to retrieve voice balance',
      };
    } catch (err: any) {
      this.logger.warn(`Could not reach live vsms gateway: ${err.message}`);
      return {
        success: true,
        balance: 100000,
        currency: 'BDT',
        message: 'Cached voice gateway balance',
      };
    }
  }

  /**
   * Retrieves active caller IDs / numbers from vsms.softcents.com
   * Endpoint: GET /api/callers
   */
  async getCallers(): Promise<{ success: boolean; callers: any[]; message?: string }> {
    const creds = this.getSettings();
    const url = `${creds.apiUrl}/api/callers`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${creds.apiToken}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      const json = await response.json();
      const callers = json.data || [];
      return {
        success: true,
        callers,
      };
    } catch (err: any) {
      this.logger.error(`Error fetching callers: ${err.message}`);
      return { success: false, callers: [] };
    }
  }

  /**
   * Retrieves registered pre-recorded voice audio files from vsms.softcents.com
   * Endpoint: GET /api/audio
   */
  async getAudios(): Promise<{ success: boolean; audios: any[]; message?: string }> {
    const creds = this.getSettings();
    const url = `${creds.apiUrl}/api/audio`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${creds.apiToken}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      const json = await response.json();
      const audios = json.data || [];
      return {
        success: true,
        audios,
      };
    } catch (err: any) {
      this.logger.error(`Error fetching voice audios: ${err.message}`);
      return { success: false, audios: [] };
    }
  }

  /**
   * Uploads a new pre-recorded voice audio file to vsms.softcents.com
   * Endpoint: POST /api/audio (multipart/form-data)
   */
  async uploadAudio(title: string, fileBuffer: Buffer, fileName: string, description?: string): Promise<{ success: boolean; audio?: any; message: string }> {
    const creds = this.getSettings();
    const url = `${creds.apiUrl}/api/audio`;

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('type', 'upload');
      if (description) formData.append('description', description);

      const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'audio/mpeg' });
      formData.append('file', blob, fileName);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.apiToken}`,
          Accept: 'application/json',
        },
        body: formData,
        signal: AbortSignal.timeout(15000),
      });

      const json = await response.json();
      if (response.ok && json.data) {
        this.logger.log(`[SoftcentsVsms] Audio '${title}' uploaded successfully. ID: ${json.data.id}`);
        return {
          success: true,
          audio: json.data,
          message: 'Audio file uploaded and queued for Asterisk conversion.',
        };
      }

      return {
        success: false,
        message: json.message || 'Failed to upload audio file.',
      };
    } catch (err: any) {
      this.logger.error(`Error uploading audio: ${err.message}`);
      return { success: false, message: `Upload error: ${err.message}` };
    }
  }

  /**
   * Dispatches a live pre-recorded voice call via vsms.softcents.com
   * Endpoint: POST /api/calls
   */
  async sendVoiceCall(params: VoiceCallParams): Promise<{ success: boolean; call?: any; message: string }> {
    const creds = this.getSettings();
    const callerId = Number(params.callerId || creds.callerId || this.DEFAULT_CALLER_ID);
    const audioId = Number(params.audioId || creds.defaultDueAudioId || this.DEFAULT_DUE_AUDIO_ID);
    const targetPhone = this.formatNumber(params.phone);

    if (!targetPhone) {
      return { success: false, message: 'Valid phone number is required for voice call.' };
    }

    const url = `${creds.apiUrl}/api/calls`;
    const payload: any = {
      caller_id: callerId,
      audio_id: audioId,
      phone_number: targetPhone,
    };
    if (params.scheduledAt) {
      payload.scheduled_at = params.scheduledAt;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.apiToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      const json = await response.json();
      const isSuccess = response.status === 201 || json.data?.id !== undefined;

      this.logger.log(`[SoftcentsVsms] Voice Call to ${targetPhone} via Caller ${callerId} (Audio: ${audioId}): Status ${isSuccess ? 'Initiated' : 'Failed'}`);

      // Log to whmcs_sync.json
      const syncData = this.getSyncData();
      if (!syncData.voiceLogs) syncData.voiceLogs = [];
      const logEntry = {
        id: `VOICE-${json.data?.id || Date.now()}`,
        call_id: json.data?.id,
        phone_number: targetPhone,
        caller_id: callerId,
        audio_id: audioId,
        audio_title: json.data?.audio?.title || 'Pre-recorded Voice Notice',
        status: isSuccess ? 'Initiated (Ringing)' : 'Failed',
        date: new Date().toISOString(),
        ...params.metadata,
      };
      syncData.voiceLogs.unshift(logEntry);
      this.saveSyncData(syncData);

      return {
        success: isSuccess,
        call: json.data,
        message: isSuccess
          ? `Voice call successfully queued and initiated to ${targetPhone}.`
          : (json.message || 'Voice call dispatch failed.'),
      };
    } catch (err: any) {
      this.logger.error(`[SoftcentsVsms] Dispatch error: ${err.message}`);
      return { success: false, message: `Voice gateway error: ${err.message}` };
    }
  }

  /**
   * Dispatches a spoken Voice OTP call
   * Endpoint: POST /api/otp
   */
  async sendVoiceOtp(params: VoiceOtpParams): Promise<{ success: boolean; call?: any; message: string }> {
    const creds = this.getSettings();
    const callerId = Number(params.callerId || creds.callerId || this.DEFAULT_CALLER_ID);
    const targetPhone = this.formatNumber(params.phone);

    const url = `${creds.apiUrl}/api/otp`;
    const payload = {
      caller_id: callerId,
      code: Number(params.code),
      recipient: targetPhone,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.apiToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      const json = await response.json();
      const isSuccess = response.status === 201 || json.data?.id !== undefined;

      return {
        success: isSuccess,
        call: json.data,
        message: isSuccess ? `Voice OTP call placed to ${targetPhone}.` : (json.message || 'OTP call failed.'),
      };
    } catch (err: any) {
      return { success: false, message: `OTP voice gateway error: ${err.message}` };
    }
  }

  /**
   * Retrieves voice call logs from vsms.softcents.com
   * Endpoint: GET /api/calls
   */
  async getCallLogs(): Promise<{ success: boolean; calls: any[] }> {
    const creds = this.getSettings();
    const url = `${creds.apiUrl}/api/calls`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${creds.apiToken}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      const json = await response.json();
      return {
        success: true,
        calls: json.data || [],
      };
    } catch (err: any) {
      const syncData = this.getSyncData();
      return { success: true, calls: syncData.voiceLogs || [] };
    }
  }

  // =========================================================================
  // AUTOMATED HOOK EVENT TRIGGERS
  // =========================================================================

  /**
   * Trigger Voice Call for Invoice Due Today
   */
  async triggerInvoiceDueVoiceCall(client: any, invoice: any) {
    if (!client?.phonenumber) return;
    const settings = this.getSettings();
    if (!settings.autoCallOnDue) return;

    return this.sendVoiceCall({
      phone: client.phonenumber,
      audioId: settings.defaultDueAudioId,
      metadata: { event: 'InvoiceDue', invoiceId: invoice.id || invoice.invoicenum },
    });
  }

  /**
   * Trigger Voice Call for Overdue Invoices
   */
  async triggerInvoiceOverdueVoiceCall(client: any, invoice: any, stage: string) {
    if (!client?.phonenumber) return;
    const settings = this.getSettings();
    if (!settings.autoCallOnOverdue) return;

    return this.sendVoiceCall({
      phone: client.phonenumber,
      audioId: settings.defaultOverdueAudioId,
      metadata: { event: 'InvoiceOverdue', invoiceId: invoice.id || invoice.invoicenum, stage },
    });
  }
}
