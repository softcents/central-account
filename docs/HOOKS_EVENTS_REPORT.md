# Hooks, Events & Automation Engine Report — SoftCents Enterprise
**Directive:** ULTIMATE MASTER DIRECTIVE V5 — Event Engine Certification  
**Date:** 2026-11-20  

---

## 1. Event & Hook Architecture

The NestJS backend implements an asynchronous, decoupled event-driven architecture using BullMQ and Redis queues:

```
[HTTP Request / Cron Trigger] 
       │
       ▼
 [Controller / Service] 
       │
       ▼
 [EventEmitter / BullMQ Queue] 
       │
       ├──► [Event Handlers] (Audit Logging, Notification, Webhook Dispatch)
       └──► [Worker Processes] (Provisioning, Email Sending, Invoice Calculation)
```

---

## 2. Event Registry & Execution Matrix

| Event Name | Trigger Source | Dispatched Actions | Idempotency Key | Status |
|---|---|---|---|:---:|
| **`ClientCreated`** | User Registration / Admin Add | Welcome email, admin notification, audit log, CRM record. | `client:{id}:created` | **PASS** |
| **`ClientUpdated`** | Profile Edit / Address Change | Admin security notice (if enabled), audit log. | `client:{id}:update:{ts}` | **PASS** |
| **`OrderCreated`** | Cart Checkout | Invoice generation, order confirmation email, pending review. | `order:{id}:created` | **PASS** |
| **`OrderPaid`** | Payment Webhook / Admin Mark | Service provisioning dispatch, receipt email, status: Active. | `order:{id}:paid` | **PASS** |
| **`InvoiceCreated`** | Recurring Billing Cron | PDF invoice generation, invoice notification email. | `invoice:{id}:created` | **PASS** |
| **`InvoicePaid`** | Gateway Callback / Add Funds | Payment record in ledger, un-suspend matching services, receipt. | `invoice:{id}:paid:{txid}` | **PASS** |
| **`InvoiceOverdue`** | Daily Overdue Cron | Overdue notice email, late fee calculation (after grace period). | `invoice:{id}:overdue:{date}` | **PASS** |
| **`PaymentFailed`** | Gateway Failure Callback | Failed payment email, retry attempt scheduling, log entry. | `payment:{txid}:failed` | **PASS** |
| **`ServiceActivated`** | Provisioning Success | Welcome email with cPanel/PBX credentials, server sync. | `service:{id}:activated` | **PASS** |
| **`ServiceSuspended`** | Overdue Cron / Admin Action | cPanel account suspension API, suspension email to client. | `service:{id}:suspended` | **PASS** |
| **`ServiceUnsuspended`** | Invoice Paid Trigger | cPanel account unsuspend API, reactivation notice email. | `service:{id}:unsuspended` | **PASS** |
| **`ServiceTerminated`** | Termination Cron / Admin Action | Server account deletion, DNS removal, audit record. | `service:{id}:terminated` | **PASS** |
| **`TicketCreated`** | Client Submission / Email Pipe | Department alert, client confirmation with ticket mask. | `ticket:{id}:created` | **PASS** |
| **`TicketUpdated`** | Staff Reply / Client Reply | Email notice, last reply timestamp update, status change. | `ticket:{id}:reply:{ts}` | **PASS** |
| **`TicketClosed`** | Auto-Close Cron / Staff Close | Ticket closure notice, feedback/rating request email. | `ticket:{id}:closed` | **PASS** |

---

## 3. Duplicate Prevention & Dead-Letter Handling
- **Idempotency Guarantees:** Every financial and provisioning event requires an idempotency key stored in Redis with a 24-hour TTL. Duplicate events with the same key are safely ignored.
- **Retry Policy:** Asynchronous worker jobs retry up to 3 times with exponential backoff (5s, 15s, 45s).
- **Dead-Letter Queue (DLQ):** Unrecoverable failures move to a dedicated dead-letter queue accessible in `/admin/utilities/module-queue` for admin inspection and manual retry.
