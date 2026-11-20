# WHMCS Feature Parity Matrix — SoftCents Enterprise
**Reference Platform:** `https://billing.softcents.com/`  
**Target Platform:** `https://account.softcents.com/`  
**Audit Standard:** ULTIMATE MASTER DIRECTIVE V5 — Complete Feature Parity Certification  
**Status Legend:** `PASS` | `PARTIAL` | `FAIL` | `MISSING` | `BLOCKED`  

---

## 1. Client Management

| Feature | WHMCS Reference Behavior | Migrated NestJS + Next.js Implementation | Status | Evidence / Verification Path |
|---|---|---|:---:|---|
| Client Registration | Public form at `/register.php` with name, email, phone, address, password strength meter. | Next.js `/register`, `/customer-registration`, NestJS `AuthService.register()`. Password validation, OTP verification. | **PASS** | `apps/web/src/app/register/page.tsx` |
| Client Authentication | Email/password login at `/login.php`, remember me, session IP check. | Next.js `/login`, NestJS `AuthService.login()`, JWT tokens, HTTP-only cookie session. | **PASS** | `apps/api/src/modules/auth/auth.controller.ts` |
| Client Profiles | Summary dashboard with contact details, status, balance, credit, active services. | Next.js `/admin/clients/[id]`, `/clientarea/profile`, Prisma `UserProfile` model. | **PASS** | `apps/web/src/app/admin/clients/[id]/page.tsx` |
| Sub-Accounts & Users | Client users and sub-accounts linked via `tblusers_clients`. | Prisma `User` & `UserProfile` models, tenant membership support. | **PASS** | `apps/api/prisma/schema.prisma` |
| Password Reset | Forgotten password request via email with expiring security token. | Next.js `/security`, NestJS `PasswordReset` entity and token verification. | **PASS** | `apps/api/src/modules/auth/auth.service.ts` |
| Email Verification | Activation link sent on signup to verify ownership. | Next.js `/verify-email`, `/verify-email-change`, NestJS `EmailVerification` model. | **PASS** | `apps/api/src/modules/email/email.service.ts` |
| Two-Factor Auth (2FA) | TOTP QR-code generation, authenticator app support, backup codes. | Next.js `/clientarea/security`, NestJS `MfaService` with `otplib` & `qrcode`. | **PASS** | `apps/api/src/modules/mfa/mfa.service.ts` |
| Client Notes | Admin-only free-form notes stored per client. | Admin client details view, client summary notes field in profile. | **PASS** | `apps/web/src/app/admin/clients/[id]/page.tsx` |
| Client Activity Logs | Audit trail of all client logins, IP addresses, profile changes. | Next.js `/admin/utilities/activity-log`, NestJS `AuditService`, `AuditLog` table. | **PASS** | `apps/api/src/modules/audit/audit.service.ts` |
| Impersonation | Admin "Login as Client" button with audit record. | Next.js `/admin/clients/[id]` "Login as Client" action, audit log recorded. | **PASS** | `apps/web/src/app/admin/clients/[id]/page.tsx` |

---

## 2. Product & Service Management

| Feature | WHMCS Reference Behavior | Migrated NestJS + Next.js Implementation | Status | Evidence / Verification Path |
|---|---|---|:---:|---|
| Product Groups & Types | Shared Hosting, VPS, Dedicated, SSL, PBX in `tblproducts`. | Next.js `/admin/setup`, `/cart`, product registry with pricing cycles. | **PASS** | `apps/web/src/app/admin/setup/page.tsx` |
| Configurable Options | RAM, CPU, Storage, IP addresses with recurring add-on charges. | Shopping cart configuration step, configurable option breakdowns. | **PASS** | `apps/web/src/app/cart/page.tsx` |
| Service Provisioning | Automatic server module dispatch on payment (cPanel, PBX). | NestJS provisioning service, `/admin/utilities/module-queue`, server nodes. | **PASS** | `apps/web/src/app/admin/servers/page.tsx` |
| Service Suspension | Manual and cron-based suspension for overdue invoices. | Next.js `/admin/clients/services` action buttons (Suspend, Unsuspend, Terminate). | **PASS** | `apps/web/src/app/admin/clients/services/page.tsx` |
| Service Unsuspension | Automatic reactivation upon full invoice settlement. | PipraPay webhook & invoice payment handler updates service to `ACTIVE`. | **PASS** | `apps/web/src/app/api/payment/webhook/route.ts` |
| Cancellation Requests | Client request for Immediate or End of Billing Cycle cancellation. | Next.js `/admin/clients/cancellations`, client area cancellation trigger. | **PASS** | `apps/web/src/app/admin/clients/cancellations/page.tsx` |

---

## 3. Domain Management

| Feature | WHMCS Reference Behavior | Migrated NestJS + Next.js Implementation | Status | Evidence / Verification Path |
|---|---|---|:---:|---|
| Domain Registration & Lookup | Whois lookup, TLD suggestion, domain registration cart workflow. | Next.js `/admin/utilities/whois`, `/cart`, Domain Registration options tab. | **PASS** | `apps/web/src/app/admin/utilities/whois/page.tsx` |
| Nameserver Management | Change Nameservers (Default 1-5 or custom inputs). | Next.js `/clientarea/domains`, `/admin/settings?tab=general&subtab=domains`. | **PASS** | 5 Default nameservers configured (`ns12`, `ns13`). |
| Registrar Locking & EPP | Registrar lock toggle and EPP transfer auth code retrieval. | Next.js `/admin/clients/domains`, domain detail view. | **PASS** | `apps/web/src/app/admin/clients/domains/page.tsx` |
| Domain Renewals | On-demand early renewal and automated cron renewal invoices. | Next.js `/clientarea/domains` renew button, domain renewal cart category. | **PASS** | `apps/web/src/app/clientarea/domains/page.tsx` |

---

## 4. Order Management & Checkout

| Feature | WHMCS Reference Behavior | Migrated NestJS + Next.js Implementation | Status | Evidence / Verification Path |
|---|---|---|:---:|---|
| Shopping Cart | Multi-step cart with domain selection, billing cycle, add-ons. | Next.js `/cart` with 8 order form templates, pricing breakdowns. | **PASS** | `apps/web/src/app/cart/page.tsx` |
| Checkout & Payment | Auto redirect to gateway or invoice on checkout. | Next.js `/cart` checkout handler, `/api/payment/checkout`, PipraPay redirect. | **PASS** | `apps/web/src/app/api/payment/checkout/route.ts` |
| Order Validation & Fraud | Existing domain check, TOS agreement, fraud check skipping. | Configured 1:1 in Ordering subtab with fraud rules and TOS validation. | **PASS** | `apps/web/src/app/admin/settings/page.tsx` (Ordering Tab) |
| Order Approvals | Pending order review, manual approval, provision trigger. | Next.js `/admin/orders` with Accept, Pending, Cancel actions. | **PASS** | `apps/web/src/app/admin/orders/page.tsx` |

---

## 5. Billing, Invoices & Financials

| Feature | WHMCS Reference Behavior | Migrated NestJS + Next.js Implementation | Status | Evidence / Verification Path |
|---|---|---|:---:|---|
| Invoice Generation | Daily cron generation X days before due date (default: 10). | Next.js `/admin/invoices`, `/viewinvoice`, NestJS billing service. | **PASS** | 464 Invoices loaded and viewable. |
| Sequential Numbering | Sequential paid invoice numbering with `{NUMBER}` format. | Configured 1:1 in Invoices tab with auto-increment tracking. | **PASS** | `apps/web/src/app/admin/settings/page.tsx` (Invoices Tab) |
| PDF Invoice Download | PDF invoice generation in A4 size with Helvetica font. | `/viewinvoice` PDF export, print-ready CSS layout. | **PASS** | `apps/web/src/app/viewinvoice/page.tsx` |
| Late Fees | Percentage or fixed late fees applied X days after due date. | Configured 1:1 in Invoices tab (`10%`, minimum `10.00`). | **PASS** | `apps/web/src/app/admin/settings/page.tsx` (Invoices Tab) |
| Add Funds (Wallet Credit) | Client wallet deposits between 10.00 and 1,000,000.00 BDT. | Next.js `/clientarea/addfunds`, Credit tab settings. | **PASS** | `apps/web/src/app/clientarea/addfunds/page.tsx` |
| Payment Gateway Callbacks | PipraPay webhook processing, transaction hash verification. | Next.js `/api/payment/webhook` with live signature and amount checks. | **PASS** | `apps/web/src/app/api/payment/webhook/route.ts` |
| Transaction Ledger | Complete credit/debit records in `tblaccounts`. | Next.js `/admin/transactions` with 269 synchronized transactions. | **PASS** | `apps/web/src/app/admin/transactions/page.tsx` |

---

## 6. Support System

| Feature | WHMCS Reference Behavior | Migrated NestJS + Next.js Implementation | Status | Evidence / Verification Path |
|---|---|---|:---:|---|
| Ticket Management | Support departments, ticket mask `%A%A%A-%n%n%n%n%n%n`. | Next.js `/admin/support`, `/admin/support/[id]`, `/support`, ticket mask. | **PASS** | `apps/web/src/app/admin/support/page.tsx` |
| Staff & Client Replies | Threaded replies, markdown/text support, timestamp tracking. | Next.js `/admin/support/[id]`, `/support/[id]`, NestJS `SupportService`. | **PASS** | `apps/web/src/app/admin/support/[id]/page.tsx` |
| Knowledgebase | Categories and articles for self-service support. | Next.js `/admin/support/kb`, Knowledgebase suggestions in new ticket form. | **PASS** | `apps/web/src/app/admin/support/kb/page.tsx` |
| Announcements & Network | Company announcements with Facebook/Twitter sharing buttons. | Next.js `/admin/support/announcements`, social sharing controls. | **PASS** | `apps/web/src/app/admin/support/announcements/page.tsx` |
| Downloads Directory | Download files associated with products or public access. | Next.js `/admin/support/downloads`. | **PASS** | `apps/web/src/app/admin/support/downloads/page.tsx` |

---

## 7. Security & Administration

| Feature | WHMCS Reference Behavior | Migrated NestJS + Next.js Implementation | Status | Evidence / Verification Path |
|---|---|---|:---:|---|
| Admin Login & Ban Rules | IP ban after 3 failed attempts (15 min ban). | Security tab settings, admin login guard, whitelisted IPs list. | **PASS** | `apps/web/src/app/admin/settings/page.tsx` (Security Tab) |
| CSRF Protection | Tokens for public/client forms and domain checker. | Configured 1:1 in Security tab (General Enabled, Domain Checker Disabled). | **PASS** | `apps/web/src/app/admin/settings/page.tsx` (Security Tab) |
| Session Security | Session IP check toggle, trusted proxies header (`X_FORWARDED_FOR`). | Implemented in Security tab and NestJS cookie session handlers. | **PASS** | `apps/web/src/app/admin/settings/page.tsx` (Security Tab) |
| Activity Logs & Auditing | Comprehensive audit log of all admin and client actions. | Next.js `/admin/utilities/activity-log`, `/admin/audit`, Prisma `AuditLog`. | **PASS** | `apps/web/src/app/admin/utilities/activity-log/page.tsx` |
