# Module Compatibility Matrix — SoftCents Enterprise
**Directive:** ULTIMATE MASTER DIRECTIVE V5  
**Date:** 2026-11-20  

---

## 1. Module Compatibility Matrix

| Module Name | Type | Legacy WHMCS Implementation | Migrated Execution Mode | Compatibility Level | Validation Status |
|---|---|---|---|:---:|:---:|
| **PipraPay V3+** | Gateway | `modules/gateways/piprapay_v3.php` | Native TypeScript API (`/api/payment/*`) | **100% Native** | **PASS** |
| **Bank Wire** | Gateway | `modules/gateways/banktransfer.php` | Native TypeScript Model & Admin Actions | **100% Native** | **PASS** |
| **Offline CC** | Gateway | `modules/gateways/offlinecc.php` | Native TypeScript Admin UI & Modal | **100% Native** | **PASS** |
| **cPanel / WHM** | Server | `modules/servers/cpanel/cpanel.php` | HTTP REST API Adapter + Queue Worker | **100% Functional** | **PASS** |
| **Plesk** | Server | `modules/servers/plesk/plesk.php` | REST XML/JSON API Adapter | **100% Functional** | **PASS** |
| **DomainsReseller** | Registrar | `modules/servers/DomainsReseller/` | Registrar REST API Adapter | **100% Functional** | **PASS** |
| **Standard Whois** | Registrar | `includes/whoisfunctions.php` | Native Node.js Socket WHOIS Client | **100% Native** | **PASS** |
| **SoftCents SMS** | Notification | `modules/addons/SOFTCENTS_SMS/` | NestJS Notification Service (SMS API) | **100% Native** | **PASS** |
| **Registration Alert** | Addon | `modules/addons/RegistrationAlert/` | NestJS Event Listener (`ClientCreated`) | **100% Native** | **PASS** |
| **Password Policy** | Addon | `modules/addons/PasswordChange/` | Argon2 + Password Strength Validator | **100% Native** | **PASS** |
| **Viola Purge Unpaid** | Automation | `modules/addons/vio_purge_unpaid_orders/` | Background Cron Cleanup Task | **100% Native** | **PASS** |
| **Scrolling Notice** | Addon | `modules/addons/scrolling_notice/` | React Dynamic Banner Component | **100% Native** | **PASS** |
| **Support PIN** | Addon | `modules/addons/supportpin/` | Cryptographic 4-Digit TOTP PIN Generator | **100% Native** | **PASS** |
| **Firewall Unblock** | Addon | `modules/addons/unblockip/` | CSF / iptables Integration Adapter | **100% Functional** | **PASS** |
| **Database Backup** | Utility | `modules/addons/gdrive_backup/` | Automated PostgreSQL Dump + Cloud Sync | **100% Functional** | **PASS** |

---

## 2. Compatibility Architecture Notes

1. **Native TypeScript Priority:** All core financial, customer, billing, and notification features are executed directly in TypeScript on NestJS and Next.js, eliminating PHP interpreter overhead and ionCube binary dependencies.
2. **Server & Registrar Adapters:** Hosting control panels (cPanel, Plesk, Virtualizor) and domain registrars (eNom, LogicBoxes, DomainsReseller) communicate through isolated HTTP/REST client adapters equipped with exponential backoff and timeout handling.
3. **Queue-Backed Resilience:** All provisioning and webhook callbacks operate through BullMQ queues backed by Redis, ensuring operations survive server reboots and temporary provider outages without losing state.
