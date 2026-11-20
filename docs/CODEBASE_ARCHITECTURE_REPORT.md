# Codebase Architecture Report — SoftCents WHMCS Enterprise Replacement
**Directive:** ULTIMATE MASTER DIRECTIVE V5  
**Target Codebase:** `/www/wwwroot/account.softcents.com`  
**Backend:** NestJS 10.4.5, Node.js 20, TypeScript 5.6, Prisma 5.21, PostgreSQL 16, Redis 7, BullMQ  
**Frontend:** Next.js 14.2.15 (App Router), React 18.3, Tailwind CSS 3.4, Lucide React  
**Date:** 2026-11-20  

---

## 1. High-Level Monorepo Architecture

The repository is organized as an enterprise npm-workspace monorepo:

```
/www/wwwroot/account.softcents.com/
├── apps/
│   ├── api/                 # NestJS Central API Service (Port 4000)
│   │   ├── prisma/          # Prisma ORM Schema & Database Migrations
│   │   ├── src/             # Application Modules, Providers, Guards, Filters
│   │   └── test/            # Jest Unit and End-to-End Test Suites
│   └── web/                 # Next.js Full-Stack Web Application (Port 3000)
│       ├── public/          # Static Assets (Images, Icons, Fonts)
│       └── src/
│           ├── app/         # Next.js App Router (84 Client and Admin Routes)
│           ├── components/  # Shared React Components (Layouts, UI Widgets)
│           └── lib/         # API Clients, Utilities, Types, Auth Helpers
├── docs/                    # Master Enterprise Audit Documentation (26 Deliverables)
├── nginx/                   # Nginx Virtual Host & SSL Reverse Proxy Configurations
├── scripts/                 # Live WHMCS Synchronization, Maintenance, Backups
└── services/
    └── face-verification/   # Biometric Face & OCR Microservice Integration
```

---

## 2. NestJS Backend Architecture (`apps/api`)

### 2.1 Core Modules & Responsibilities
1. **`AppModule` (`apps/api/src/app.module.ts`):** Root module configuring environment variables, throttling, Redis, and importing domain modules.
2. **`PrismaModule` (`apps/api/src/prisma/`):** Global database service managing PostgreSQL connection pooling, query lifecycle, transactions, and disconnect hooks.
3. **`AuthModule` (`apps/api/src/modules/auth/`):** JWT token generation, Passport strategies, password hashing with Argon2, user session management, and HTTP-only cookie issuance.
4. **`UserModule` (`apps/api/src/modules/user/`):** User profile CRUD, registration workflows, email change requests, and client status synchronization.
5. **`BillingModule` (`apps/api/src/modules/billing/`):** Invoicing engine, recurring billing calculation, payment transaction processing, and PipraPay gateway integration.
6. **`SupportModule` (`apps/api/src/modules/support/`):** Ticket ticketing system, department routing, staff responses, client responses, attachments, and canned replies.
7. **`TenantModule` (`apps/api/src/modules/tenant/`):** Multi-tenant organization support, tenant membership, API key management, and domain binding.
8. **`IdentityModule` (`apps/api/src/modules/identity/`):** KYC/KYB identity verification, document OCR analysis, biometric liveness validation, and audit trail.
9. **`MfaModule` (`apps/api/src/modules/mfa/`):** Two-Factor Authentication via TOTP RFC-6238, QR code rendering, and single-use backup recovery codes.
10. **`AuditModule` (`apps/api/src/modules/audit/`):** Centralized immutable activity logging tracking user actions, IP addresses, user agents, and administrative actions.
11. **`WebhookModule` (`apps/api/src/modules/webhook/`):** Inbound gateway callback dispatch, HMAC signature validation, and outbound event notifications.

### 2.2 Dependency Injection & Clean Architecture
- **Guards:** `JwtAuthGuard`, `AdminRoleGuard`, `BusinessRoleGuard`, `ThrottlerGuard` enforcing RBAC and rate limits.
- **Interceptors:** Logging, response transformation, and correlation ID tracking.
- **Exception Filters:** Global `HttpExceptionFilter` translating errors into structured RFC-7807 compliant error responses.
- **Validation Pipes:** Class-validator DTOs validating every incoming request payload.

---

## 3. Next.js Frontend Architecture (`apps/web`)

### 3.1 App Router Structure
The frontend provides two distinct UI portals:
- **Admin Portal (`/admin/*`):** Pixel-perfect replica of WHMCS administrative interface with top header widgets, sidebar navigation, table management, action modals, and all 12 General Settings subtabs.
- **Client Portal (`/clientarea/*`, `/cart`, `/viewinvoice`, `/support`):** Modern responsive customer control panel with service cards, invoice payment flows, wallet funding, and ticket submission.

### 3.2 State Management & Performance
- Server Components used for static layouts and SEO-critical routes.
- Client Components (`'use client'`) used for interactive forms, subtabs, and modals.
- Real-time notification banners, confirmation dialogs, and responsive mobile navbars.
