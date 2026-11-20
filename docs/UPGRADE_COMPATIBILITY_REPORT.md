# Upgrade & Release Compatibility Report — SoftCents Enterprise
**Directive:** ULTIMATE MASTER DIRECTIVE V5 — Upgrade & Release Engineering Audit  
**Date:** 2026-11-20  

---

## 1. Release Lifecycle & Migration Ordering

1. **Semantic Versioning:** Releases follow SemVer `MAJOR.MINOR.PATCH`.
2. **Prisma Migrations:** Schema changes executed strictly through `npx prisma migrate deploy` in deterministic, ordered SQL migration files located in `apps/api/prisma/migrations/`.
3. **Zero-Downtime Rollouts:**
   - Web application built ahead of process restart with `npm run build:web`.
   - Process substitution handled gracefully; port 3000 stays active until new bundle is ready.
4. **Rollback Procedures:**
   - Database rollback via idempotent down-migrations or database snapshot restoration.
   - Codebase rollback via Git checkout tag (`git checkout vX.Y.Z`) and rebuild.
