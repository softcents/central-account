# Automation Certification — SoftCents Enterprise
**Directive:** ULTIMATE MASTER DIRECTIVE V5 — Automation & Scheduler Certification  
**Date:** 2026-11-20  
**Certification Status:** **PASSED & OPERATIONAL**  

---

## 1. Scheduled Tasks & Cron Engine Architecture

Automation is handled via a hybrid scheduler architecture:
- **System Watchdog (`watchdog.sh`):** Executes every 2 minutes via crontab to verify port 3000 (Web) and port 4000 (API) health and auto-heal.
- **WHMCS Data Synchronization (`cron_sync_whmcs.sh`):** Executes every hour via crontab to sync delta updates.
- **NestJS Internal Cron Jobs:** Powered by `@nestjs/schedule` and BullMQ for queue-backed background processing.

---

## 2. Automation Tasks Matrix

| Automation Task | Trigger Schedule | Function & Business Logic | Status |
|---|:---:|---|:---:|
| **Recurring Invoice Generation** | Daily (09:00 AM) | Generates invoices for services due in 10 days. | **PASS** |
| **Payment Reminders** | Daily | Sends upcoming due notices (7 days before, 1 day before). | **PASS** |
| **Overdue Notices & Late Fees** | Daily | Applies 10% late fee 4 days after due date. | **PASS** |
| **Automated Suspension** | Daily | Suspends active services overdue by threshold. | **PASS** |
| **Automated Unsuspension** | Real-time (Event) | Instantly unsuspends services upon payment confirmation. | **PASS** |
| **Domain Expiry Reminders** | Daily | Sends renewal notices 30, 7, and -3 days relative to expiry. | **PASS** |
| **Stale Order Cleanup** | Daily | Purges or cancels unpaid pending orders after grace days. | **PASS** |
| **Ticket Auto-Close** | Daily | Closes resolved tickets with no response after 72 hours. | **PASS** |
| **Database Backup** | Nightly (03:00 AM) | Generates full PostgreSQL `pg_dump` with gzip compression. | **PASS** |
