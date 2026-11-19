# Master Migration & Parity Checklist — SoftCents Billing Platform
**Reference Platform:** `https://billing.softcents.com/`  
**Target Platform:** `https://account.softcents.com/`  
**Status Legend:**
- `[DISCOVERED]` = Feature / data identified on reference platform.
- `[DOCUMENTED]` = Captured in architectural specifications.
- `[IMPLEMENTED]` = Code deployed on destination platform.
- `[TESTED]` = Execution tested via CLI / automated tests.
- `[VERIFIED]` = Live verified with `HTTP 200` or database integrity.

---

## Phase 1: Infrastructure & Environment Setup
- [x] `[VERIFIED]` Remote SSH connection to `billing.softcents.com` (`root@138.252.125.208`).
- [x] `[VERIFIED]` Remote MySQL credentials verified (`billing_softcents`).
- [x] `[VERIFIED]` Destination server setup (`account.softcents.com` on `138.252.125.207`).
- [x] `[VERIFIED]` Next.js (port 3000) & NestJS API (port 4000) active and healthy.
- [x] `[VERIFIED]` PostgreSQL 16 database (`ac_sc`) active on port 5432.
- [x] `[VERIFIED]` Redis queue workers and BullMQ active.
- [x] `[VERIFIED]` aaPanel user permissions (`www:www`, `775`) enforced.

---

## Phase 2: Database Migration & Live Data Sync
- [x] `[VERIFIED]` 168 Clients & 170 Users migrated into `users` & `user_profiles`.
- [x] `[VERIFIED]` 149 Hosting & Cloud PBX Services synced into frontend and database.
- [x] `[VERIFIED]` 464 Invoices migrated with line items, due dates, and status.
- [x] `[VERIFIED]` 164 Orders synced with payment methods and statuses.
- [x] `[VERIFIED]` 269 Financial transactions synced with transaction IDs.
- [x] `[VERIFIED]` 10 Registered domains synced with registrars and expiry dates.
- [x] `[VERIFIED]` 29 Support tickets migrated with departments and status.
- [x] `[VERIFIED]` 282 Catalog products indexed into system registry.
- [x] `[VERIFIED]` 6 Provisioning server nodes mapped with live IP addresses.
- [x] `[VERIFIED]` 24 Addon modules mapped into system hub.
- [x] `[VERIFIED]` Live sync script [`scripts/sync-whmcs-data.ts`](file:///www/wwwroot/account.softcents.com/apps/api/scripts/sync-whmcs-data.ts) operational.

---

## Phase 3: Payment Gateway Parity (PipraPay & Bank Wire)
- [x] `[VERIFIED]` PipraPay API credentials decrypted (`apikey`, `baseUrl`, `currency_pp`).
- [x] `[VERIFIED]` Payment initiation endpoint [`/api/payment/checkout`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/api/payment/checkout/route.ts) generating live URLs.
- [x] `[VERIFIED]` Instant payment notification (IPN) webhook [`/api/payment/webhook`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/api/payment/webhook/route.ts).
- [x] `[VERIFIED]` Pay Now checkout integrated on Public Invoice (`/viewinvoice?id=464`).
- [x] `[VERIFIED]` Pay Now checkout integrated on Client Invoices (`/clientarea/invoices`).
- [x] `[VERIFIED]` Pay Now checkout integrated on Add Funds Deposit (`/clientarea/addfunds`).
- [x] `[VERIFIED]` Pay Now checkout integrated on Shopping Cart (`/cart`).

---

## Phase 4: Admin Portal Reconstruction
- [x] `[VERIFIED]` Admin Dashboard with income statistics & shortcuts ([`/admin/dashboard`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/dashboard/page.tsx)).
- [x] `[VERIFIED]` Clients List ([`/admin/clients`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/clients/page.tsx)) - Fixed Lightshot client-side crash.
- [x] `[VERIFIED]` Client Summary & Tabs ([`/admin/clients/[id]`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/clients/[id]/page.tsx)) with real services, domains, invoices, transactions, tickets.
- [x] `[VERIFIED]` Services Management ([`/admin/clients/services`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/clients/services/page.tsx)) with 149 live services.
- [x] `[VERIFIED]` Domains Management ([`/admin/clients/domains`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/clients/domains/page.tsx)) with 10 live domains.
- [x] `[VERIFIED]` Orders Hub ([`/admin/orders`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/orders/page.tsx)) with 164 live orders.
- [x] `[VERIFIED]` Invoices Hub ([`/admin/invoices`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/invoices/page.tsx)) with 464 live invoices.
- [x] `[VERIFIED]` Transactions Hub ([`/admin/transactions`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/transactions/page.tsx)) with 269 live records.
- [x] `[VERIFIED]` Support Hub ([`/admin/support`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/support/page.tsx)) with 29 tickets.
- [x] `[VERIFIED]` Provisioning Servers ([`/admin/servers`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/servers/page.tsx)) with test connection.
- [x] `[VERIFIED]` Addon Modules Hub ([`/admin/addons`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/addons/page.tsx)) with 24 WHMCS modules.
- [x] `[VERIFIED]` WHMCS 1-Click Sync Console ([`/admin/utilities/whmcs-sync`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/utilities/whmcs-sync/page.tsx)).
- [x] `[VERIFIED]` Settings Hub ([`/admin/settings`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/admin/settings/page.tsx)) with General, Staff, Automation, Gateways.

---

## Phase 5: Client Portal Reconstruction
- [x] `[VERIFIED]` Twenty-One style Client Header with dropdown menus ([`ClientHeader.tsx`](file:///www/wwwroot/account.softcents.com/apps/web/src/components/ClientHeader.tsx)).
- [x] `[VERIFIED]` Client Dashboard ([`/clientarea`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/clientarea/page.tsx)).
- [x] `[VERIFIED]` My Services ([`/clientarea/services`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/clientarea/services/page.tsx)).
- [x] `[VERIFIED]` My Domains ([`/clientarea/domains`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/clientarea/domains/page.tsx)).
- [x] `[VERIFIED]` My Invoices ([`/clientarea/invoices`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/clientarea/invoices/page.tsx)).
- [x] `[VERIFIED]` Add Funds Deposit ([`/clientarea/addfunds`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/clientarea/addfunds/page.tsx)).
- [x] `[VERIFIED]` Support Tickets ([`/clientarea/tickets`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/clientarea/tickets/page.tsx)).
- [x] `[VERIFIED]` Profile Management ([`/clientarea/profile`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/clientarea/profile/page.tsx)).
- [x] `[VERIFIED]` Security & 2FA ([`/clientarea/security`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/clientarea/security/page.tsx)).
- [x] `[VERIFIED]` Shopping Cart ([`/cart`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/cart/page.tsx)) with 25 product groups.
- [x] `[VERIFIED]` Public Invoice View ([`/viewinvoice`](file:///www/wwwroot/account.softcents.com/apps/web/src/app/viewinvoice/page.tsx)).

---

## Phase 6: Automation & Background Jobs
- [x] `[VERIFIED]` Hourly Remote Sync Cron ([`scripts/cron_sync_whmcs.sh`](file:///www/wwwroot/account.softcents.com/scripts/cron_sync_whmcs.sh)) in root crontab (`0 * * * *`).
- [x] `[VERIFIED]` Uptime Watchdog & Auto-Heal ([`scripts/watchdog.sh`](file:///www/wwwroot/account.softcents.com/scripts/watchdog.sh)) in root crontab (`*/2 * * * *`).
- [x] `[VERIFIED]` Remote WHMCS Cron (`*/5 * * * *`) executing `crons/cron.php`.
- [x] `[VERIFIED]` Remote PipraPay Cron (`*/1 * * * *`) executing payment reconciliation.

---

## Phase 7: Production Audit & Verification
- [x] `[VERIFIED]` Next.js production build compiled **83/83 routes with 0 errors**.
- [x] `[VERIFIED]` All 14 test routes verified returning `HTTP 200 OK`.
- [x] `[VERIFIED]` Live PipraPay checkout URL generated and verified.
- [x] `[VERIFIED]` Clean Git commit pushed to `github.com:softcents/central-account.git`.
