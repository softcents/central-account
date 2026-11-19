# System Settings Inventory — SoftCents Billing Platform
**Reference Platform:** `https://billing.softcents.com/`  
**Target Platform:** `https://account.softcents.com/`  
**Source Table:** `tblconfiguration` (MariaDB `billing_softcents`)  
**Generated At:** 2026-11-20  

---

## 1. General & Localization Settings

| Setting Key | Active Value | Description |
|---|---|---|
| `CompanyName` | `SoftCents Systems` | Official trading entity name |
| `SystemURL` | `https://billing.softcents.com/` | Canonical production URL |
| `Domain` | `http://billing.softcents.com` | Base domain address |
| `LogoURL` | `https://billing.softcents.com/logo.png` | Primary company logo |
| `Email` | `no-reply@softcents.com` | System sender email address |
| `DefaultCountry` | `BD` | Default locale: Bangladesh |
| `DateFormat` | `DD/MM/YYYY` | Standard date format |
| `DefaultLanguage`| `english` | System default language |
| `Template` | `twenty-one` | Default client theme (Twenty-One) |
| `AdminTemplate` | `blend` | Default admin theme (Blend) |

---

## 2. Invoicing, Due Dates & Financial Rules

| Setting Key | Active Value | Description |
|---|---|---|
| `CreateInvoiceDaysBefore` | `10` | Invoices generated 10 days before due date |
| `SendReminder` | `on` | Automated payment reminder emails enabled |
| `SendInvoiceReminderDays` | `7` | First overdue reminder sent 7 days after due date |
| `AutoSuspension` | `on` | Automated suspension enabled |
| `AutoSuspensionDays` | `0` | Immediate suspension at 0 days past due |
| `AutoTermination` | `off` | Automated termination requires manual or 300-day window |
| `AutoTerminationDays` | `300` | Account cleanup threshold (300 days) |
| `AddFundsMinimum` | `10.00` | Minimum deposit threshold: ৳10.00 BDT |
| `AddFundsMaximum` | `1000000.00` | Maximum deposit threshold: ৳1,000,000.00 BDT |
| `Currency` | `BDT` (Tk) | Primary billing currency |

---

## 3. Email & SMTP Transport Settings

| Setting Key | Active Value | Description |
|---|---|---|
| `MailType` | `mail` / `smtp` | Mail transport engine |
| `SMTPHost` | `mail.softcents.com` | Outgoing mail server |
| `SMTPPort` | `25` (TLS/SSL: `587` / `465`) | Mail port |
| `SMTPSSL` | `ssl` | Secure transport encryption |
| `SMTPUsername` | `no-reply@softcents.com` | Authenticated SMTP account |

---

## 4. Payment Gateway Settings

### 4.1. PipraPay V3+ Payment Gateway
- **Name:** PipraPay Payment Gateway (bKash / Nagad / Rocket / Cards)
- **Status:** Active & Primary
- **Base URL:** `https://epay.softcents.com/api`
- **API Key:** `b3e91bb98e0d874acb860272f240000b48a47368010ed81017`
- **Supported Currencies:** `BDT`
- **Webhook Callback:** `https://account.softcents.com/api/payment/webhook`

### 4.2. Bank Transfer / Wire
- **Name:** Direct Bank Transfer
- **Status:** Active
- **Instructions:** Eastern Bank Ltd. (EBL) / City Bank / BRAC Bank SoftCents Systems corporate account.

---

## 5. Provisioning Server Settings

1. **`srv8` (cPanel):** IP `125.253.92.7`, Hostname: `srv8.whitednszone.com`, Max accounts: 200, Status: Active
2. **`srv111-bdpbx-1` (Cloud PBX):** Hostname: `srv111.bdpbx.com`, Type: PBX, Max accounts: 200, Status: Active
3. **`srv5` (cPanel):** IP `66.85.167.28`, Hostname: `srv5.whitednszone.com`, Status: Standby
4. **`srv7` (cPanel):** IP `103.65.138.66`, Hostname: `srv7.whitednszone.com`, Status: Standby
5. **`bdix111` (cPanel):** Hostname: `bdix111.softcents.com`, Status: Standby
6. **`SC bdpbx-server22` (PBX):** Hostname: `srv111.bdpbx.com`, Status: Standby

---

## 6. Administrators & Roles

- **Super Administrator (`SUPER_ADMIN`):** Full access to billing, servers, addons, settings, and database.
- **KYC Reviewer (`KYC_REVIEWER`):** Access to verify / reject customer NID, smart cards, and trade licenses.
- **Support Agent (`SUPPORT_AGENT`):** Access to view and reply to customer support tickets and knowledgebase.
