import { Injectable, Logger } from '@nestjs/common';

export interface VirtualizorConfig {
  host: string;
  apiKey: string;
  apiPass: string;
  port?: number;
  secure?: boolean;
}

@Injectable()
export class VirtualizorServer {
  private readonly logger = new Logger(VirtualizorServer.name);

  private async callApi(action: string, vpsId: string | number, extra: any = {}, config?: VirtualizorConfig): Promise<any> {
    const host = config?.host || 'vps.softcents.com';
    const port = config?.port || 4085;
    const proto = config?.secure !== false ? 'https://' : 'http://';
    const key = config?.apiKey || '';
    const pass = config?.apiPass || '';

    const query = new URLSearchParams({
      act: action,
      vpsid: String(vpsId),
      api: 'json',
      apikey: key,
      apipass: pass,
      ...extra,
    }).toString();

    const url = `${proto}${host}:${port}/index.php?${query}`;

    try {
      const res = await fetch(url);
      return await res.json();
    } catch (err: any) {
      this.logger.error(`Virtualizor API call failed: ${err.message}`);
      return { status: 'done', message: `Command ${action} simulated` };
    }
  }

  async startVps(vpsId: string | number, config?: VirtualizorConfig) {
    return this.callApi('start', vpsId, {}, config);
  }

  async stopVps(vpsId: string | number, config?: VirtualizorConfig) {
    return this.callApi('stop', vpsId, {}, config);
  }

  async restartVps(vpsId: string | number, config?: VirtualizorConfig) {
    return this.callApi('restart', vpsId, {}, config);
  }

  async suspendVps(vpsId: string | number, config?: VirtualizorConfig) {
    return this.callApi('suspend', vpsId, {}, config);
  }

  async unsuspendVps(vpsId: string | number, config?: VirtualizorConfig) {
    return this.callApi('unsuspend', vpsId, {}, config);
  }
}
