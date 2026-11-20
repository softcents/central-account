# Bug Remediation Changelog — SoftCents Enterprise
**Directive:** ULTIMATE MASTER DIRECTIVE V5 — Automatic Bug Detection & Remediation  
**Date:** 2026-11-20  

---

## 1. Remediation Registry & Issue Resolution Log

| Issue ID | Severity | Component Affected | Root Cause | Implemented Solution | Verification Evidence |
|---|:---:|---|---|---|:---:|
| **BUG-001** | **P2** | `MfaService` Unit Test | Test assertion expected legacy string `Central%20Identity%20Platform` instead of updated production platform name `Central%20Account%20Platform`. | Updated OTP auth issuer URL assertion in `mfa.service.spec.ts`. | `PASS` (3/3 tests passing) |
| **BUG-002** | **P2** | `KycDecisionEngineService` | Input test fixture used face similarity `0.35` which triggered early hard-mismatch return (`< 0.40`) before overall score fallthrough. | Calibrated test fixture face score to `0.45` to specifically test the overall weighted score fallthrough. | `PASS` (7/7 tests passing) |
| **BUG-003** | **P2** | `InternalPythonProvider` Spec | Unit tests attempted live network connection to local Python microservice port 8000; threw `ECONNREFUSED`. | Added contract-accurate mock responses in test setup reflecting Python microservice snake_case outputs. | `PASS` (6/6 tests passing) |
| **BUG-004** | **P1** | General Settings UI (`Social` & `Other` Tabs) | Tabs 11 and 12 were incomplete placeholders in the Next.js admin settings page. | Built 1:1 pixel-perfect WHMCS Social and Other subtabs with live values from `billing.softcents.com`. | `PASS` (Production build 84/84 routes, HTTP 200 verified) |

---

## 2. Regression Verification Summary
- **Unit Test Coverage:** 12 test suites, 78 unit tests passing with **0 failures**.
- **Frontend Build Status:** Next.js production build compiled cleanly across all 84 routes.
- **Port Status:** Port 3000 (Web) and Port 4000 (API) responding with HTTP 200 OK.
