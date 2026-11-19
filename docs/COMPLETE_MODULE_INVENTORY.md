# Complete Module Inventory — SoftCents Billing Platform
**Reference Platform:** `https://billing.softcents.com/`  
**Target Platform:** `https://account.softcents.com/`  
**Generated At:** 2026-11-20  
**Inspection Type:** Full Root & Database Physical Inspection (Debian 12 / MariaDB `billing_softcents`)

---

## Executive Summary

The reference billing system at `billing.softcents.com` is a customized enterprise WHMCS platform running **44 Addon Modules**, **7 Payment Gateway Modules**, **30 Server Provisioning Modules**, **28 Domain Registrar Modules**, and custom hooks for Bangladesh telecom (IP Phone recharge, Bulk SMS, WhatsApp notifications, KYC/NID document verification).

This document captures the complete architectural, functional, database, and integration inventory for every discovered module.

---

## 1. Addon Modules Inventory

### 1.1. Advanced Client Verification (KYC / NID / Trade License)
- **Module Name:** `advanced_client_verification` (ACV)
- **Filesystem Path:** `/www/wwwroot/billing.softcents.com/modules/addons/advanced_client_verification/`
- **Database Tables:**
  - `mod_advanced_client_verification` (104 records)
  - `mod_acv_activity_log` (777 records)
  - `mod_acv_admin_notes`
  - `mod_acv_documents`
  - `mod_acv_verification_reminders`
- **Purpose & Workflow:**
  1. Automated identity compliance required under Bangladesh BTRC telecom regulations for IP Phone and PBX assignment.
  2. Captures NID (National ID), Smart Card, Passport, or Trade License with front/back document images and live selfie.
  3. Supports OCR data extraction, face similarity matching, and manual staff approval.
  4. Triggers automatic service suspension if identity is unverified within deadline, and automatic unsuspension upon verification.
- **Custom Email Templates:**
  - `ACV Verification Required`, `ACV Verification Pending`, `ACV Verification Approved`, `ACV Verification Declined`, `ACV Service Suspended`, `ACV Service Reactivated`.
- **Target Implementation:** Integrated into `apps/web/src/app/admin/kyc`, `apps/web/src/app/identity/*`, and NestJS Identity Module (`apps/api/src/modules/identity/`).

---

### 1.2. SoftCents WhatsApp Notification Engine
- **Module Name:** `bdhost_wa` (SoftCents WhatsApp Gateway V8.4)
- **Filesystem Path:** `/www/wwwroot/billing.softcents.com/modules/addons/bdhost_wa/`
- **Database Tables:**
  - `mod_bdhost_wa_settings` (Gateway endpoint: `https://wpg.softcents.com`, API Key: `ifYGD36mDa2AcgbLrRBRhQdnj6jcmk`, Sender: `8801713252753`)
  - `mod_bdhost_wa_auto_queue` (701 queued/dispatched messages)
  - `mod_bdhost_wa_reports` (389 delivery log records)
  - `mod_bdhost_wa_templates` (35 notification templates)
- **Hooks & Triggers:**
  - `InvoiceCreated`, `InvoicePaymentReminder`, `InvoicePaid`, `InvoiceCancelled`, `InvoiceUnpaid`
  - `OrderCreated`, `OrderCancelled`, `FraudOrder`
  - `ServiceActivated`, `ServiceSuspended`, `ServiceTerminated`
  - `TicketOpened`, `TicketReplyStaff`, `TicketReplyClient`
  - `ClientRegistration`, `ClientPasswordReset`
- **Target Implementation:** Integrated into `apps/api/src/modules/webhook/` and background queue worker.

---

### 1.3. SoftCents SMS Gateway Engine
- **Module Name:** `SOFTCENTS_SMS` & `bdwebs_sms` (Version 1.7)
- **Filesystem Path:** `/www/wwwroot/billing.softcents.com/modules/addons/SOFTCENTS_SMS/`
- **Database Tables:**
  - `mod_bdhost_sms_settings`
  - `mod_bdhost_sms_templates` (29 templates)
- **Purpose:** SMS notifications via SoftCents' own telecom aggregator infrastructure for instant OTP, billing reminders, and service provisioning alerts.
- **Target Implementation:** Integrated into notification service and SMS dispatch worker.

---

### 1.4. iTalk VoIP / IP Phone Recharge & Balance System
- **Module Name:** `italk_recharge` & `italk_balance`
- **Filesystem Path:** `/www/wwwroot/billing.softcents.com/modules/addons/italk_recharge/`
- **Database Tables:**
  - `mod_italk_providers` (4 telecom providers: `09644 iTalk SIP`, `09639 ICC Talk`, `09617 Ranks ITT`, `09647 WebVoice`)
  - `mod_italk_recharge` (Client IP Phone PIN numbers e.g. `09644551969`, `09617777313`)
  - `mod_italk_recharge_log` (42 recharge transactions)
  - `mod_italk_balance` & `mod_italk_balance_urls`
- **Purpose:**
  - Allows customers to recharge talk-time balance for their assigned 0961X, 09644, 09639 IP phone numbers.
  - Automates balance check and API top-up across SIP switches.
- **Target Implementation:** Integrated into `/clientarea/services` and `/admin/addons` VoIP management console.

---

### 1.5. Domains Reseller Module
- **Module Name:** `DomainsReseller`
- **Filesystem Path:** `/www/wwwroot/billing.softcents.com/modules/addons/DomainsReseller/`
- **Database Tables:** `DomainsReseller_Commands`, `DomainsReseller_Resellers`, `DomainsReseller_Pricing`, `DomainsReseller_Logger` (16 tables).
- **Purpose:** Allows sub-resellers to register and manage TLDs via SoftCents API.

---

### 1.6. Additional Discovered Addon Modules
| Addon Name | Directory | Status / Function |
|---|---|---|
| **unblockip** | `modules/addons/unblockip/` | cPanel/CSF firewall IP unblocker for clients |
| **uptime_PowerTools** | `modules/addons/uptime_PowerTools/` | Server and uptime diagnostics |
| **supportpin** | `modules/addons/supportpin/` | Customer verification pin for phone/ticket support |
| **reseller_center** | `modules/addons/reseller_center/` | Multi-tier reseller account hub |
| **RegistrationAlert** | `modules/addons/RegistrationAlert/` | Instant notification upon new client registration |
| **dynamiccoupon** | `modules/addons/dynamiccoupon/` | Automated promotional discounts on cart checkout |
| **cpusernamechanger** | `modules/addons/cpusernamechanger/` | Automated cPanel username modification |
| **domainchanger** | `modules/addons/domainchanger/` | Primary domain change utility for hosting accounts |
| **emailverification** | `modules/addons/emailverification/` | Client email confirmation enforcement |
| **gdrive_backup** | `modules/addons/gdrive_backup/` | Automated daily database off-site backup to Google Drive |
| **whois** | `modules/addons/whois/` | WHOIS domain availability and RDAP query engine |
| **vio_purge_unpaid_orders** | `modules/addons/vio_purge_unpaid_orders/` | Automated order cancellation cleanup |
| **staffboard** | `modules/addons/staffboard/` | Internal admin communication board |
| **scrolling_notice** | `modules/addons/scrolling_notice/` | Client area flash alert marquee |

---

## 2. Payment Gateways Inventory

| Gateway | Module File | Integration Type | Active Credentials |
|---|---|---|---|
| **PipraPay** | `modules/gateways/piprapay.php` | API Redirect + Webhook (V3+) | **Live:** `https://epay.softcents.com/api` (Key: `b3e91...`) |
| **Bank Transfer** | `modules/gateways/banktransfer.php` | Offline / Wire Transfer | **Live:** Eastern Bank Ltd. / City Bank / BRAC Bank |
| **UddoktaPay** | `modules/gateways/uddoktapay.php` | Alternative MFS Gateway | Configured |
| **UddoktaPay Int**| `modules/gateways/uddoktapayinternational.php` | International Gateway | Configured |
| **Reseller Gateway**| `modules/gateways/reseller_gateway.php` | Internal Credit/Wallet | Configured |

---

## 3. Server Provisioning Modules Inventory

| Module Name | Type | Target System | Supported Actions |
|---|---|---|---|
| **cpanel** | Web Hosting | `srv8.whitednszone.com` (`125.253.92.7`) | Create, Suspend, Unsuspend, Terminate, Change Package, Change Password, Single Sign-On (SSO) |
| **pbx** / **softcentspbx** | Cloud PBX | `srv111.bdpbx.com` | Create Extension, Assign IP Number, Suspend, Unsuspend, Terminate, Reset SIP Password |
| **virtualizor** | Cloud VPS | KVM Hypervisor Nodes | Boot, Shutdown, Reboot, Reinstall OS, VNC Console, Bandwidth Graph |
| **directadmin** | Web Hosting | DirectAdmin Nodes | Account Provisioning |
| **plesk** | Web Hosting | Plesk Windows/Linux Nodes | Subscription Provisioning |

---

## 4. Domain Registrars Inventory

- **Active Registrars:** ResellerClub, LogicBoxes / Pipra, BdwebsReseller, Namecheap, Enom, CentralNic.
- **Capabilities:**
  - Realtime TLD Availability Check
  - Domain Registration & Automated Renewal
  - Domain Transfer with EPP Code Verification
  - Nameserver Management (Custom & Default)
  - WHOIS Contact Details Management & ID Protection
  - DNS Record Management (A, CNAME, MX, TXT)
