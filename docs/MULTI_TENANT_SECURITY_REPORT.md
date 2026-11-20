# Multi-Tenant & Security Report — SoftCents Enterprise
**Directive:** ULTIMATE MASTER DIRECTIVE V5 — Multi-Tenant Access Control Audit  
**Date:** 2026-11-20  

---

## 1. Multi-Tenant Architecture & Data Isolation

The platform supports both direct retail customers and multi-tenant organizational accounts:
- **Tenant Entity (`Tenant`):** Represents an organization, enterprise, or reseller account.
- **Tenant Membership (`TenantMember`):** Maps users to tenants with strict role-based access control (`OWNER`, `ADMIN`, `MEMBER`, `BILLING`).
- **Data Scoping:** Invoices, API keys, custom domains, and support tickets are explicitly scoped by `tenantId`.
- **Cross-Tenant Isolation:** Database queries enforce `tenantId` constraints in Prisma where tenant context is present; no tenant can view, query, or modify another tenant's private assets.

---

## 2. Access Control Testing (RBAC & IDOR)

| Attack Vector / Security Test | Test Execution | Result | Status |
|---|---|---|:---:|
| **Insecure Direct Object Reference (IDOR)** | Requesting `/admin/invoices/[id]` or `/clientarea/invoices` for unauthorized customer. | Session ownership check enforces ownership validation; returns HTTP 403 Forbidden. | **PASS** |
| **Horizontal Privilege Escalation** | Tenant user attempting to read another tenant's API keys or webhooks. | Blocked by `TenantGuard`; returns HTTP 403 Forbidden. | **PASS** |
| **Vertical Privilege Escalation** | Client user calling administrative endpoint `/api/admin/*`. | Blocked by `AdminRoleGuard`; returns HTTP 401/403. | **PASS** |
| **Impersonation Audit Logging** | Admin logging in as client from admin panel. | Permanent log entry written to `AdminAuditLog` with admin user ID, client ID, and timestamp. | **PASS** |
