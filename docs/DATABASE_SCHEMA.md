# Database Schema & Migration Mapping — SoftCents Billing Platform
**Source Database:** MariaDB `billing_softcents` (147 tables) on `billing.softcents.com`  
**Target Database:** PostgreSQL 16 `ac_sc` on `account.softcents.com`  
**Generated At:** 2026-11-20  

---

## 1. Architectural Strategy

The target system utilizes **PostgreSQL 16** managed via Prisma ORM for structured relations, JSONB columns for flexible WHMCS line items and custom field configurations, and UUID primary keys linked to legacy integer WHMCS IDs (`whmcs_id`).

### Key Principles:
1. **Zero Data Loss:** All 168 clients, 170 users, 149 services, 464 invoices, 269 transactions, 10 domains, and 29 tickets are preserved with exact historical IDs, timestamps, and payment gateway references.
2. **Financial Integrity:** Invoices, line items, and transaction logs maintain double-entry balance accounting (`amount_in`, `fees`, `amount_out`, `currency`).
3. **Continuous Sync Capability:** The schema supports bidirectional live synchronization via [`apps/api/scripts/sync-whmcs-data.ts`](file:///www/wwwroot/account.softcents.com/apps/api/scripts/sync-whmcs-data.ts).

---

## 2. Table-by-Table Schema Mapping

### 2.1. Clients & Users

| Source Table (`billing_softcents`) | Target Model (`ac_sc` PostgreSQL) | Field Mapping & Transformations |
|---|---|---|
| `tblclients` (168 rows) | `UserProfile` (`user_profiles`) | `id` -> legacy ID stored; `firstname`, `lastname` -> `first_name`, `last_name`; `companyname` -> `company_name`; `email` -> `User.email`; `phonenumber` -> `phone_number`; `address1`, `city`, `state`, `country` -> `country_code` ('BD'); `credit` -> `credit_balance`; `status` -> `status` ('ACTIVE' / 'SUSPENDED'); `datecreated` -> `created_at`. |
| `tblusers` (170 rows) | `User` (`users`) | `email` -> `email` (unique index); `password` -> `password_hash` (bcrypt); `email_verified` -> `email_verified`; `created_at` -> `created_at`. |
| `tblcontacts` (0 rows) | `TenantMember` (`tenant_members`) | Sub-accounts and authorized billing contacts. |

### 2.2. Invoices & Financial Accounting

| Source Table (`billing_softcents`) | Target Model (`ac_sc` PostgreSQL) | Field Mapping & Transformations |
|---|---|---|
| `tblinvoices` (464 rows) | `Invoice` (`invoices`) | `id` -> `invoice_number` (`INV-{id}`); `userid` -> mapped to `tenant_id` / client; `date` -> `created_at`; `duedate` -> `due_date`; `total` -> `amount` (Float); `status` ('Paid' -> `PAID`, 'Unpaid' -> `OPEN`, 'Cancelled' -> `VOID`); `paymentmethod` -> `line_items.paymentMethod`. |
| `tblinvoiceitems` (721 rows) | `Invoice.line_items` (JSONB) | `type`, `description`, `amount`, `taxed` aggregated into structured JSON array. |
| `tblaccounts` (269 rows) | `Payment` (`payments`) | `id` -> `id`; `invoiceid` -> `invoice_id`; `transid` -> `transaction_id`; `amountin` -> `amount`; `fees` -> `fee_amount`; `gateway` -> `payment_method` ('PIPRAPAY', 'BANK_TRANSFER'); `date` -> `created_at`. |

### 2.3. Services & Hosting Provisioning

| Source Table (`billing_softcents`) | Target Model (`ac_sc` PostgreSQL) | Field Mapping & Transformations |
|---|---|---|
| `tblhosting` (149 rows) | `Subscription` (`subscriptions`) & `whmcs_sync.json` | `id` -> `service_id`; `userid` -> `user_id`; `packageid` -> `plan_id`; `server` -> `server_id`; `domain` -> `domain`; `username` -> `username`; `amount` -> `recurring_amount`; `billingcycle` -> `billing_cycle` ('MONTHLY', 'ANNUALLY', 'ONETIME'); `nextduedate` -> `current_period_end`; `domainstatus` -> `status` ('ACTIVE', 'SUSPENDED', 'TERMINATED'). |
| `tblservers` (6 rows) | System Server Registry | `id`, `name` ('srv8', 'srv111'), `ipaddress`, `hostname`, `type` ('cpanel', 'pbx'), `active` (Boolean). |
| `tblproducts` (282 rows) | `Plan` (`plans`) | `id`, `gid` (Group ID), `name`, `type` ('hostingaccount', 'other'), `paytype`, `description`. |
| `tblproductgroups` (25 rows) | Catalog Groups | `id`, `name` ('Cloud PBX', 'Shared Hosting', 'Bulk SMS', 'IP Phone Number'), `slug`. |

### 2.4. Domains & Registrars

| Source Table (`billing_softcents`) | Target Model (`ac_sc` PostgreSQL) | Field Mapping & Transformations |
|---|---|---|
| `tbldomains` (10 rows) | `CustomDomain` (`custom_domains`) & Domain Registry | `id`, `userid`, `domain`, `registrationperiod`, `recurringamount`, `paymentmethod`, `registrationdate`, `expirydate`, `nextduedate`, `status` ('Active', 'Expired'), `registrar` ('Pipra', 'ResellerClub'). |

### 2.5. Support & Communications

| Source Table (`billing_softcents`) | Target Model (`ac_sc` PostgreSQL) | Field Mapping & Transformations |
|---|---|---|
| `tbltickets` (29 rows) | `SupportTicket` (`support_tickets`) | `id` -> `id` (`tkt_whmcs_{id}`); `tid` -> `ticket_number`; `userid` -> `user_id`; `title` -> `subject`; `message` -> `description`; `status` -> `TicketStatus` (`OPEN`, `IN_REVIEW`, `CLOSED`); `urgency` -> `TicketPriority` (`LOW`, `NORMAL`, `HIGH`); `date` -> `created_at`. |
| `tblticketdepartments` (3 rows) | Ticket Departments | `1: Sales`, `2: Technical Support`, `3: Site Migration`. |

### 2.6. Identity Verification (KYC / NID)

| Source Table (`billing_softcents`) | Target Model (`ac_sc` PostgreSQL) | Field Mapping & Transformations |
|---|---|---|
| `mod_advanced_client_verification` (104 rows) | `IdentityVerification` (`identity_verifications`) | `client_id` -> `user_id`; `status` ('verified' -> `VERIFIED`, 'declined' -> `REJECTED`, 'pending' -> `IN_REVIEW`); `document_type` -> `document_type` ('NID', 'SMART_CARD', 'PASSPORT'); `document_number` -> `id_number`; `verified_at` -> `reviewed_at`. |
| `mod_acv_activity_log` (777 rows) | `AuditLog` (`audit_logs`) | Audit trail of all identity submissions and verification results. |

---

## 3. Data Integrity & Verification Queries

```sql
-- Client and user verification in PostgreSQL
SELECT count(*) FROM users;            -- 170
SELECT count(*) FROM user_profiles;    -- 168
SELECT count(*) FROM invoices;         -- 464
SELECT count(*) FROM support_tickets;  -- 29

-- Remote WHMCS consistency check
SELECT count(*) FROM tblclients;       -- 168
SELECT count(*) FROM tblhosting;       -- 149
SELECT count(*) FROM tbldomains;       -- 10
SELECT count(*) FROM tblorders;        -- 164
SELECT count(*) FROM tblinvoices;      -- 464
SELECT count(*) FROM tblaccounts;      -- 269
```
