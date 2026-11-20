# Email & Notification Engine Audit — SoftCents Enterprise
**Directive:** ULTIMATE MASTER DIRECTIVE V5 — Email & Notification Engine Audit  
**Date:** 2026-11-20  

---

## 1. Notification Engine Architecture

Notification delivery is driven by `apps/api/src/modules/email/email.service.ts` with multi-channel dispatch:
- **SMTP Gateway:** Connected to `mail.softcents.com` on port 25 with SSL/TLS encryption (`no-reply@softcents.com`).
- **Templating Engine:** Dynamic HTML/plain-text email templates with auto-injected system variables:
  `{$client_name}`, `{$invoice_id}`, `{$invoice_total}`, `{$service_domain}`, `{$ticket_mask}`.
- **Global Styling & Header/Footer:** 100% matched to WHMCS Mail Settings (Global CSS Styling, Client Header, Client Footer).
- **SMS Gateway Integration:** Real-time SMS dispatch via SoftCents SMS aggregator for transactional billing alerts.
- **Queue Backing:** Email jobs enqueued in BullMQ to prevent HTTP latency during order checkout and ticket submissions.
