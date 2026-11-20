# Module Ecosystem Report — SoftCents WHMCS Enterprise
**Directive:** ULTIMATE MASTER DIRECTIVE V5 — Module Ecosystem Audit  
**Date:** 2026-11-20  

---

## 1. Discovered WHMCS Module Inventory

From live forensics on `billing.softcents.com`, the following 24 modules, gateways, and addons were inventoried:

| Module Identifier | Category | Reference Role | Migrated Implementation Status |
|---|---|---|:---:|
| **`piprapay_v3`** | Payment Gateway | Automated bKash, Nagad, Rocket, Upay payment gateway with instant callbacks. | **NATIVE IMPLEMENTATION** (`/api/payment/checkout`, `/api/payment/webhook`) |
| **`banktransfer`** | Payment Gateway | Offline bank wire instructions and manual receipt verification. | **NATIVE IMPLEMENTATION** (Offline instructions and admin payment recording) |
| **`mailin`** | Payment Gateway | Mail-in physical check and cash ledger tracking. | **NATIVE IMPLEMENTATION** (Offline CC and cash transactions) |
| **`cpanel`** | Provisioning | Automatic cPanel account creation, password reset, quota modification, suspend, unsuspend, terminate. | **ADAPTER LAYER** (`apps/web/src/app/admin/servers`, module queue worker) |
| **`plesk`** | Provisioning | Plesk Onyx/Obsidian hosting provisioning module. | **ADAPTER LAYER** (Configured server node endpoint) |
| **`DomainsReseller`** | Registrar | Domain registration, renewal, nameservers, EPP code for reseller domains. | **ADAPTER LAYER** (`apps/web/src/app/admin/clients/domains`) |
| **`whmcsdomains`** | Registrar | WHMCS default domain lookup spinner and registration API. | **NATIVE IMPLEMENTATION** (Lookup & whois utility) |
| **`SOFTCENTS_SMS`** | Notification | Automated SMS notifications on invoice generation, payment confirmation, ticket creation. | **NATIVE NESTJS SERVICE** (`apps/api/src/modules/email/email.service.ts` & SMS gateway) |
| **`RegistrationAlert`** | Addon / Security | Real-time admin alert when new customer registers. | **NATIVE NESTJS EVENT** (`ClientCreated` event listener) |
| **`PasswordChange`** | Addon / Security | Client password policy enforcer and security pin generator. | **NATIVE NESTJS SERVICE** (`UserSecurity` model, Argon2 hashing) |
| **`ViolaPurgeUnpaidOrders`** | Addon / Automation | Automated cancellation and purging of stale unpaid orders after grace period. | **AUTOMATION ENGINE** (Ordering tab grace days & cleanup utility) |
| **`ScrollingNotice`** | Addon / UI | Broadcast banner shown across client portal for system announcements. | **NATIVE UI COMPONENT** (Top announcement bar in Next.js client layout) |
| **`supportpin`** | Addon / Support | Generates 4-6 digit support verification pin for customer identity confirmation over phone/ticket. | **NATIVE IMPLEMENTATION** (Client profile security badge) |
| **`unblockip`** | Addon / Security | Client self-service tool to check and unblock IP address from server CSF/cPHulk firewall. | **NATIVE SERVICE** (`/admin/utilities/cleanup`, firewall unblock utility) |
| **`cpusernamechanger`** | Addon / Utility | Admin and client tool to modify cPanel username without breaking service bindings. | **ADAPTER UTILITY** (`/admin/utilities/whmcs-sync`) |
| **`gdrive_backup`** | Addon / Backup | Nightly database dump export to Google Drive API. | **CRON SCRIPT** (Automated backup bash runner in crontab) |
| **`RSThemes` / Lagom2** | Client Theme | Premium WHMCS client area theme. | **NATIVE REACT UI** (Next.js responsive layout faithful to Lagom2 UI) |
| **`blend`** | Admin Theme | WHMCS standard administrative theme. | **NATIVE REACT UI** (Next.js `/admin/*` interface faithful to Blend theme) |

---

## 2. Enterprise Module Framework Specifications

To ensure long-term stability and eliminate reliance on legacy PHP code, the migrated system enforces a standardized TypeScript module interface:

```typescript
export interface EnterpriseModule {
  id: string;
  name: string;
  version: string;
  category: 'gateway' | 'provisioning' | 'registrar' | 'notification' | 'security' | 'addon';
  description: string;
  author: string;
  enabled: boolean;
  configSchema: Record<string, ModuleConfigField>;
  initialize(): Promise<boolean>;
  healthCheck(): Promise<ModuleHealthStatus>;
  executeAction(action: string, payload: unknown): Promise<ModuleActionResult>;
  teardown(): Promise<void>;
}
```

### Module Isolation & Safety
1. **Error Isolation:** Individual module exceptions are caught in try/catch boundaries; module crashes never crash NestJS or Next.js.
2. **Credential Protection:** API keys and passwords stored in encrypted columns with AES-256-GCM.
3. **Audit Logging:** Every external API request is logged with timestamp, request payload, response status, and latency.
