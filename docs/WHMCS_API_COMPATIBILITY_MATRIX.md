# WHMCS API Compatibility Matrix — SoftCents Enterprise
**Directive:** ULTIMATE MASTER DIRECTIVE V5 — API & Backward Compatibility Audit  
**Date:** 2026-11-20  

---

## 1. Core API Endpoint Compatibility

| WHMCS API Action | HTTP Method | NestJS Endpoint | Request Format | Response Format | Auth Method | Compatibility Status |
|---|:---:|---|---|---|:---:|:---:|
| `GetClients` | GET / POST | `/api/users` | `{ limit, offset, search }` | `{ total, clients: [...] }` | Bearer JWT / API Key | **PASS** |
| `GetClientsDetails` | GET / POST | `/api/users/:id` | `{ clientid }` | `{ client: { id, name, email, ... } }` | Bearer JWT / API Key | **PASS** |
| `GetInvoices` | GET / POST | `/api/billing/invoices` | `{ status, userid, limit }` | `{ total, invoices: [...] }` | Bearer JWT / API Key | **PASS** |
| `GetInvoice` | GET / POST | `/api/billing/invoices/:id` | `{ invoiceid }` | `{ invoice: { id, total, items, ... } }` | Bearer JWT / API Key | **PASS** |
| `GetOrders` | GET / POST | `/api/orders` | `{ status, userid, limit }` | `{ total, orders: [...] }` | Bearer JWT / API Key | **PASS** |
| `GetProducts` | GET / POST | `/api/products` | `{ gid, pid }` | `{ products: [...] }` | Bearer JWT / Public | **PASS** |
| `GetTickets` | GET / POST | `/api/support/tickets` | `{ status, deptid, clientid }` | `{ total, tickets: [...] }` | Bearer JWT / API Key | **PASS** |
| `GetTicket` | GET / POST | `/api/support/tickets/:id` | `{ ticketid }` | `{ ticket, replies: [...] }` | Bearer JWT / API Key | **PASS** |
| `AddOrder` | POST | `/api/orders` | `{ clientid, pid, billingcycle, domain }` | `{ result: "success", orderid, invoiceid }` | Bearer JWT / API Key | **PASS** |
| `AddTransaction` | POST | `/api/billing/transactions` | `{ invoiceid, transid, amount, gateway }` | `{ result: "success", transid }` | Bearer JWT / API Key | **PASS** |
| `AcceptOrder` | POST | `/api/orders/:id/accept` | `{ orderid }` | `{ result: "success" }` | Admin JWT / API Key | **PASS** |
| `OpenTicket` | POST | `/api/support/tickets` | `{ clientid, deptid, subject, message }` | `{ result: "success", ticketid }` | Bearer JWT / Client | **PASS** |
| `AddTicketReply` | POST | `/api/support/tickets/:id/reply` | `{ ticketid, message, clientid/adminid }` | `{ result: "success" }` | Bearer JWT | **PASS** |
| `PaymentCallback` | POST | `/api/payment/webhook` | `{ status, transaction_id, amount, ... }` | `{ status: "success", verified: true }` | HMAC SHA-256 Signature | **PASS** |

---

## 2. API Security & Quality Attributes

1. **Authentication:** Supported via Bearer JWT (Access Token RFC-6750) and Tenant API Key headers (`X-Api-Key`).
2. **Rate Limiting:** Managed globally by `@nestjs/throttler` (configured at 100 requests / minute per IP with custom whitelists).
3. **Idempotency:** Payment and order creation requests accept an `Idempotency-Key` header to prevent duplicate charge transactions.
4. **Validation:** Inbound JSON payloads strictly parsed and validated using `class-validator` DTOs.
