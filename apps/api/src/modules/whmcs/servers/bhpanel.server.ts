import { Injectable, Logger } from '@nestjs/common';

export interface BHPanelConfig {
  host?: string;
  port?: number;
  apiToken?: string;
  secure?: boolean;
}

export interface BHPanelCreateAccountParams {
  username: string;
  domain: string;
  password: string;
  plan?: string;
  contactEmail: string;
  config?: BHPanelConfig;
}

@Injectable()
export class BHPanelServer {
  private readonly logger = new Logger(BHPanelServer.name);

  private readonly DEFAULT_HOST = 'bdix-bh.softcents.com';
  private readonly DEFAULT_PORT = 2304;
  private readonly DEFAULT_TOKEN = 'bhp_live_25053977ad81b7efb2195683b2986c461f5b004335918255749054166b268d3d';

  private getBaseUrl(config?: BHPanelConfig): string {
    const host = config?.host || this.DEFAULT_HOST;
    const port = config?.port || this.DEFAULT_PORT;
    const proto = config?.secure !== false ? 'https://' : 'http://';
    return `${proto}${host}:${port}`;
  }

  private getToken(config?: BHPanelConfig): string {
    return config?.apiToken || this.DEFAULT_TOKEN;
  }

  /**
   * Core API request handler for BHPanel
   */
  private async apiCall(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body: any = null,
    config?: BHPanelConfig,
  ): Promise<{ ok: boolean; data?: any; error?: string }> {
    const baseUrl = this.getBaseUrl(config);
    const token = this.getToken(config);
    const url = `${baseUrl}${path}`;

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };

      const opts: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(4000),
      };

      if (body !== null && ['POST', 'PUT', 'DELETE'].includes(method)) {
        headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }

      const res = await fetch(url, opts);
      const json = await res.json();
      return json;
    } catch (err: any) {
      this.logger.error(`BHPanel API error [${method} ${path}]: ${err.message}`, err.stack);
      return { ok: false, error: err.message };
    }
  }

  /**
   * Health ping
   */
  async ping(config?: BHPanelConfig): Promise<{ ok: boolean; data?: any }> {
    return this.apiCall('GET', '/v1/ping', null, config);
  }

  /**
   * Fetches hosting packages/plans from BHPanel
   */
  async getPlans(config?: BHPanelConfig): Promise<{ ok: boolean; packages?: any[]; error?: string }> {
    const res = await this.apiCall('GET', '/v1/plans', null, config);
    if (res.ok && res.data?.packages) {
      return { ok: true, packages: res.data.packages };
    }
    return { ok: false, error: res.error || 'Failed to fetch plans' };
  }

  /**
   * Lists all user accounts on the BHPanel server
   */
  async listAccounts(config?: BHPanelConfig): Promise<{ ok: boolean; accounts?: any[]; error?: string }> {
    const res = await this.apiCall('GET', '/v1/accounts', null, config);
    if (res.ok && Array.isArray(res.data)) {
      return { ok: true, accounts: res.data };
    }
    return { ok: false, error: res.error || 'Failed to list accounts' };
  }

  /**
   * Creates a new web hosting account on BHPanel
   */
  async createAccount(params: BHPanelCreateAccountParams): Promise<{ success: boolean; message: string; details?: any }> {
    const postData = {
      username: params.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16),
      domain: params.domain.toLowerCase().trim(),
      password: params.password,
      package: params.plan || 'customer_2g',
      email: params.contactEmail || 'billing@softcents.com',
    };

    const res = await this.apiCall('POST', '/v1/accounts', postData, params.config);

    if (res.ok) {
      this.logger.log(`Created BHPanel account for user ${postData.username} (${postData.domain})`);
      return {
        success: true,
        message: 'BHPanel account created successfully',
        details: res.data,
      };
    }

    return {
      success: false,
      message: res.error || 'Failed to create BHPanel account',
    };
  }

  /**
   * Suspends a hosting account
   */
  async suspendAccount(username: string, domain: string, reason = 'Non-payment', config?: BHPanelConfig): Promise<{ success: boolean; message: string }> {
    const res = await this.apiCall('POST', `/v1/accounts/${username}/suspend`, {
      expect_domain: domain,
      reason,
    }, config);

    return {
      success: res.ok,
      message: res.ok ? 'Account suspended on BHPanel' : (res.error || 'Failed to suspend account'),
    };
  }

  /**
   * Unsuspends a hosting account
   */
  async unsuspendAccount(username: string, domain: string, config?: BHPanelConfig): Promise<{ success: boolean; message: string }> {
    const res = await this.apiCall('POST', `/v1/accounts/${username}/unsuspend`, {
      expect_domain: domain,
    }, config);

    return {
      success: res.ok,
      message: res.ok ? 'Account unsuspended on BHPanel' : (res.error || 'Failed to unsuspend account'),
    };
  }

  /**
   * Terminates/Removes a hosting account
   */
  async terminateAccount(username: string, domain: string, config?: BHPanelConfig): Promise<{ success: boolean; message: string }> {
    const res = await this.apiCall('DELETE', `/v1/accounts/${username}`, {
      expect_domain: domain,
    }, config);

    return {
      success: res.ok,
      message: res.ok ? 'Account removed from BHPanel' : (res.error || 'Failed to terminate account'),
    };
  }

  /**
   * Updates an account's password
   */
  async changePassword(username: string, domain: string, newPass: string, config?: BHPanelConfig): Promise<{ success: boolean; message: string }> {
    const res = await this.apiCall('PUT', `/v1/accounts/${username}/password`, {
      expect_domain: domain,
      password: newPass,
    }, config);

    return {
      success: res.ok,
      message: res.ok ? 'Password updated on BHPanel' : (res.error || 'Failed to update password'),
    };
  }

  /**
   * Updates an account's plan/package
   */
  async changePackage(username: string, domain: string, newPlan: string, config?: BHPanelConfig): Promise<{ success: boolean; message: string }> {
    const res = await this.apiCall('PUT', `/v1/accounts/${username}/plan`, {
      expect_domain: domain,
      package: newPlan,
    }, config);

    return {
      success: res.ok,
      message: res.ok ? 'Package updated on BHPanel' : (res.error || 'Failed to update package'),
    };
  }

  /**
   * Generates a One-Click Single Sign-On (SSO) login URL into BHPanel (cPanel UI)
   * Optional 'to' destination: 'files', 'mail', 'databases', 'ssl', 'wordpress', 'backups', 'dns', 'ftp', 'cron'
   */
  async generateSsoUrl(username?: string, domain?: string, to?: string, config?: BHPanelConfig): Promise<{ success: boolean; ssoUrl?: string; error?: string }> {
    let resolvedUser = (username || '').trim().toLowerCase();
    const cleanDomain = (domain || '').trim().toLowerCase();

    // 1. Try with provided username if we have one
    if (resolvedUser) {
      const postData: any = {};
      if (cleanDomain) postData.expect_domain = cleanDomain;
      if (to) postData.to = to;

      const res = await this.apiCall('POST', `/v1/accounts/${resolvedUser}/signin`, postData, config);
      if (res.ok && res.data?.url) {
        this.logger.log(`Generated BHPanel SSO URL for user ${resolvedUser}: ${res.data.url}`);
        return {
          success: true,
          ssoUrl: res.data.url,
        };
      }
    }

    // 2. If username not provided or failed, look up account list by domain or username prefix
    try {
      const accountsRes = await this.apiCall('GET', '/v1/accounts', null, config);
      if (accountsRes.ok && Array.isArray(accountsRes.data)) {
        const found = accountsRes.data.find((acc: any) => {
          if (cleanDomain && (acc.domain?.toLowerCase() === cleanDomain || (Array.isArray(acc.sites) && acc.sites.some((s: string) => s.toLowerCase() === cleanDomain)))) {
            return true;
          }
          if (resolvedUser && acc.username?.toLowerCase() === resolvedUser) {
            return true;
          }
          return false;
        });

        if (found) {
          resolvedUser = found.username;
          const postData: any = {};
          if (found.domain) postData.expect_domain = found.domain;
          if (to) postData.to = to;

          const res = await this.apiCall('POST', `/v1/accounts/${resolvedUser}/signin`, postData, config);
          if (res.ok && res.data?.url) {
            this.logger.log(`Resolved and generated BHPanel SSO URL for ${resolvedUser} (${cleanDomain}): ${res.data.url}`);
            return {
              success: true,
              ssoUrl: res.data.url,
            };
          }
        }
      }
    } catch (e: any) {
      this.logger.error(`BHPanel account lookup error: ${e.message}`);
    }

    return {
      success: false,
      ssoUrl: `https://${config?.host || this.DEFAULT_HOST}:2083`,
      error: 'Failed to generate one-click SSO token',
    };
  }

  /**
   * Generates Root Admin Single Sign-On URL to port 2087
   */
  async generateAdminSsoUrl(config?: BHPanelConfig): Promise<{ success: boolean; ssoUrl?: string; error?: string }> {
    const res = await this.apiCall('POST', '/v1/signin', {}, config);
    if (res.ok && res.data?.url) {
      this.logger.log(`Generated BHPanel Admin SSO: ${res.data.url}`);
      return {
        success: true,
        ssoUrl: res.data.url,
      };
    }
    return {
      success: false,
      ssoUrl: `https://${config?.host || this.DEFAULT_HOST}:2087`,
      error: res.error || 'Failed to generate admin SSO',
    };
  }

  /**
   * Fetches real-time disk and bandwidth usage from BHPanel
   */
  async getAccountUsage(username: string, domain?: string, config?: BHPanelConfig): Promise<{ ok: boolean; data?: any; error?: string }> {
    const res = await this.apiCall('GET', `/v1/accounts/${username}/usage`, null, config);
    return res;
  }

  /**
   * Fetches account summary information
   */
  async getAccountSummary(username: string, config?: BHPanelConfig): Promise<{ ok: boolean; data?: any; error?: string }> {
    const res = await this.apiCall('GET', `/v1/accounts/${username}/summary`, null, config);
    return res;
  }
}
