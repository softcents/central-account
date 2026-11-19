# Project Status — SoftCents Billing Platform
**Reference Platform:** `https://billing.softcents.com/`  
**Live Platform:** `https://account.softcents.com/`  
**Latest Update:** 2026-11-20  
**Overall Status:** **Operational & Feature Parity Verified**

---

## 1. Executive Summary

The migration and 1:1 reconstruction of the SoftCents Systems Billing Platform from `billing.softcents.com` to `account.softcents.com` has achieved verified functional parity.

All **168 clients**, **149 hosting/PBX services**, **464 invoices**, **164 orders**, **269 transactions**, **10 domains**, and **29 support tickets** are actively loaded into PostgreSQL and the Next.js frontend. The **PipraPay V3+** automated payment gateway is live and generating checkout links in real time.

---

## 2. Infrastructure & Port Status

| Service | Host / Port | Status | Health Check |
|---|---|:---:|---|
| **Next.js Web Frontend** | `127.0.0.1:3000` | **HEALTHY** | `HTTP 200 OK` (83 static/dynamic routes) |
| **NestJS Central API** | `127.0.0.1:4000` | **HEALTHY** | `HTTP 200 OK` (`/api/countries`) |
| **PostgreSQL 16 Database**| `127.0.0.1:5432` | **HEALTHY** | Database `ac_sc` (54 tables, 170 users) |
| **Redis Cache & BullMQ** | `127.0.0.1:6379` | **HEALTHY** | Connected & Processing jobs |
| **Uptime Watchdog** | Local Crontab | **ACTIVE** | Runs every 2 min (`watchdog.sh`) |
| **WHMCS Sync Cron** | Local Crontab | **ACTIVE** | Runs every 1 hr (`cron_sync_whmcs.sh`) |

---

## 3. Verified System Metrics

| Metric Category | WHMCS Source (`billing.softcents.com`) | Destination (`account.softcents.com`) | Parity Status |
|---|:---:|:---:|:---:|
| **Clients & Users** | 168 Clients / 170 Users | 168 Clients / 170 Users | **100% Parity** |
| **Active Services** | 149 Services | 149 Services | **100% Parity** |
| **Invoices** | 464 Invoices | 464 Invoices | **100% Parity** |
| **Orders** | 164 Orders | 164 Orders | **100% Parity** |
| **Transactions** | 269 Ledger Entries | 269 Ledger Entries | **100% Parity** |
| **Domains** | 10 Domains | 10 Domains | **100% Parity** |
| **Support Tickets** | 29 Tickets | 29 Tickets | **100% Parity** |
| **Product Catalog** | 282 Products / 25 Groups | 282 Products / 25 Groups | **100% Parity** |
| **Provisioning Servers**| 6 Server Nodes | 6 Server Nodes | **100% Parity** |
| **Addon Modules** | 24 Addon Modules | 24 Addon Modules | **100% Parity** |
| **Payment Gateway** | PipraPay V3+ Live | PipraPay V3+ Live | **Verified Functional** |

---

## 4. Key Endpoints

- **Admin Portal:** [`https://account.softcents.com/admin/dashboard`](https://account.softcents.com/admin/dashboard)
- **Clients Management:** [`https://account.softcents.com/admin/clients`](https://account.softcents.com/admin/clients)
- **Services List:** [`https://account.softcents.com/admin/clients/services`](https://account.softcents.com/admin/clients/services)
- **Domains List:** [`https://account.softcents.com/admin/clients/domains`](https://account.softcents.com/admin/clients/domains)
- **Orders Hub:** [`https://account.softcents.com/admin/orders`](https://account.softcents.com/admin/orders)
- **Invoices Hub:** [`https://account.softcents.com/admin/invoices`](https://account.softcents.com/admin/invoices)
- **Client Portal:** [`https://account.softcents.com/clientarea`](https://account.softcents.com/clientarea)
- **Shopping Cart:** [`https://account.softcents.com/cart`](https://account.softcents.com/cart)
- **Public Invoice View:** [`https://account.softcents.com/viewinvoice?id=464`](https://account.softcents.com/viewinvoice?id=464)
- **Payment API:** `POST /api/payment/checkout` & `POST /api/payment/webhook`

---

## 5. Repository & Codebase

- **Git Branch:** `main`
- **Latest Commit:** `a6d07b4` (pushed to `github.com:softcents/central-account.git`)
- **Documentation:**
  - [`COMPLETE_MODULE_INVENTORY.md`](file:///www/wwwroot/account.softcents.com/COMPLETE_MODULE_INVENTORY.md)
  - [`COMPLETE_PAGE_INVENTORY.md`](file:///www/wwwroot/account.softcents.com/COMPLETE_PAGE_INVENTORY.md)
  - [`DATABASE_SCHEMA.md`](file:///www/wwwroot/account.softcents.com/DATABASE_SCHEMA.md)
  - [`API_DOCUMENTATION.md`](file:///www/wwwroot/account.softcents.com/API_DOCUMENTATION.md)
  - [`AUTOMATION_INVENTORY.md`](file:///www/wwwroot/account.softcents.com/AUTOMATION_INVENTORY.md)
  - [`SETTINGS_INVENTORY.md`](file:///www/wwwroot/account.softcents.com/SETTINGS_INVENTORY.md)
  - [`MIGRATION_CHECKLIST.md`](file:///www/wwwroot/account.softcents.com/MIGRATION_CHECKLIST.md)
  - [`PROJECT_STATUS.md`](file:///www/wwwroot/account.softcents.com/PROJECT_STATUS.md)
