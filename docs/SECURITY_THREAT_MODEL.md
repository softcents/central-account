# Security Threat Model & Vulnerability Assessment — SoftCents Enterprise
**Directive:** ULTIMATE MASTER DIRECTIVE V5 — Security Audit & Threat Model  
**Date:** 2026-11-20  

---

## 1. Threat Modeling (STRIDE Methodology)

| Threat Category | Potential Attack Vector | Applied Countermeasure | Verification Status |
|---|---|---|:---:|
| **Spoofing Identity** | Fake authentication, session hijacking, credential stuffing. | Argon2 password hashing, TOTP 2FA, session IP validation, trusted proxy header verification. | **PASS** |
| **Tampering with Data** | Parameter tampering in checkout, modifying invoice totals, SQL injection. | Prisma parameterized queries (zero raw SQL concatenation), server-side price calculation, HMAC signature validation on webhooks. | **PASS** |
| **Repudiation** | Denying payment actions, disputing staff ticket replies. | Centralized immutable audit logs (`AuditLog`, `AdminAuditLog`), IP and user agent capture on every state modification. | **PASS** |
| **Information Disclosure** | IDOR on invoices/tickets, verbose error traces, secret exposure in logs. | Role-based authorization guards, session ownership checks, strict data masking (passwords, tokens, and keys excluded from logs). | **PASS** |
| **Denial of Service** | Volumetric API flooding, brute-force admin login attempts. | Throttling (100 req/min per IP), failed login IP ban (15 min ban after 3 failures), Redis distributed rate limiting. | **PASS** |
| **Elevation of Privilege** | Client escalating to admin, tenant escalating to global owner. | Strict RBAC guards (`AdminRoleGuard`, `TenantRoleGuard`), zero trust token validation. | **PASS** |

---

## 2. Vulnerability Assessment Matrix

| Vulnerability Type | OWASP Top 10 Reference | Evaluation & Testing | Residual Risk | Status |
|---|:---:|---|:---:|:---:|
| **SQL Injection** | A03:2021-Injection | Evaluated: Prisma ORM strictly parameterizes all SQL queries. | None | **SAFE** |
| **Cross-Site Scripting (XSS)** | A03:2021-Injection | React JSX auto-escapes HTML strings by default; sanitization applied to ticket messages. | Negligible | **SAFE** |
| **Cross-Site Request Forgery (CSRF)** | A01:2021-Broken Access | SameSite cookie policy, CSRF tokens active on public/client forms. | Negligible | **SAFE** |
| **Server-Side Request Forgery (SSRF)** | A10:2021-SSRF | Webhooks only accepted from known PipraPay IPs and verified with digital signatures. | Low | **SAFE** |
| **Insecure Deserialization** | A08:2021-Software/Data | No `eval()` or unvetted deserializers used. Standard `JSON.parse` with schema validation. | None | **SAFE** |
| **Broken Access Control (IDOR)** | A01:2021-Broken Access | Every endpoint verifies authenticated user ID matches requested resource owner. | None | **SAFE** |
