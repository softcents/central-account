# Automation Inventory — SoftCents Billing Platform
**Reference Platform:** `https://billing.softcents.com/`  
**Target Platform:** `https://account.softcents.com/`  
**Generated At:** 2026-11-20  

---

## 1. Executive Summary

Automation is the backbone of SoftCents Systems' billing and telecom operations. The system automates the complete lifecycle:
**Order Placement -> Payment Verification -> Automatic Server Provisioning -> Invoice Generation -> Payment Reminders -> Overdue Suspension -> Termination Cleanup.**

---

## 2. Recurring Cron Schedule

| Cron Schedule | Frequency | Script / Command | Primary Function |
|---|---|---|---|
| `*/1 * * * *` | Every 1 minute | `curl -s https://epay.softcents.com/cron/` | **PipraPay Payment Gateway Auto-Reconciliation:** Polls pending MFS charges and auto-clears invoices upon bank/bKash confirmation. |
| `*/5 * * * *` | Every 5 minutes | `php -q /www/wwwroot/billing.softcents.com/crons/cron.php` | **WHMCS Master Automation Engine:** Daily invoice generation, reminders, automated suspensions, and cancellation queue. |
| `*/2 * * * *` | Every 2 minutes | `/www/wwwroot/account.softcents.com/scripts/watchdog.sh` | **Uptime Watchdog & Auto-Heal:** Continuously verifies frontend (port 3000) and backend API (port 4000). Reboots services on any failure. |
| `0 * * * *` | Every 1 hour | `/www/wwwroot/account.softcents.com/scripts/cron_sync_whmcs.sh` | **Live Remote Sync:** Synchronizes all 168 clients, 149 services, 464 invoices, and 29 tickets from `billing.softcents.com`. |

---

## 3. Automation Business Rules

### 3.1. Invoicing & Billing Cycle
- **Advance Invoice Generation:** Invoices are generated **10 days** prior to service due date (`CreateInvoiceDaysBefore = 10`).
- **Payment Reminders:** First overdue reminder sent **7 days** after due date (`SendInvoiceReminderDays = 7`).
- **Auto Add-Funds Credit Applied:** If a client has an active credit balance in their wallet, it is automatically applied towards unpaid recurring invoices.

### 3.2. Service Suspension & Termination
- **Automatic Suspension (`AutoSuspension = on`):**
  - **Grace Period:** **0 days** (`AutoSuspensionDays = 0`).
  - **Action:** Exactly at midnight following the due date, any unpaid service is automatically suspended on `srv8` cPanel or `srv111` Cloud PBX.
  - **Notification:** Sends WhatsApp alert (`mod_bdhost_wa`), SMS, and email (`ACV Service Suspended`).
- **Automatic Unsuspension:**
  - Upon invoice payment confirmation via PipraPay or Bank Transfer, the provisioning module immediately un-suspends the cPanel / PBX extension without staff intervention.
- **Automatic Termination (`AutoTerminationDays = 300`):**
  - Suspended accounts older than 300 days are permanently terminated to free up server disk space and IP phone number inventory.

### 3.3. Identity Verification (KYC / NID) Automation
- **Unverified Account Restriction:** If an account fails to submit NID or Passport within the compliance window, telecom services (Cloud PBX & IP phone numbers) are locked.
- **Automatic Reactivation:** Successful biometric or staff verification triggers instant reactivation across all provisioned services.

### 3.4. WhatsApp & SMS Notification Automation
- **Queue Worker:** Messages are queued in `mod_bdhost_wa_auto_queue` with exponential backoff retry (up to 3 retries).
- **Triggers:**
  - `InvoiceCreated`: Dispatches PDF link and PipraPay checkout URL to client's mobile number.
  - `InvoicePaid`: Sends instant digital payment receipt.
  - `ServiceActivated`: Sends SIP / cPanel credentials securely to WhatsApp.

---

## 4. Automation Control & Admin Override

Administrators can inspect and control all automations from:
1. **Automation Status Console:** [`/admin/utilities/automation-status`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/utilities/automation-status/page.tsx)
2. **Settings Panel:** [`/admin/settings?tab=automation`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/settings/page.tsx)
3. **Live Sync Console:** [`/admin/utilities/whmcs-sync`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/utilities/whmcs-sync/page.tsx)
