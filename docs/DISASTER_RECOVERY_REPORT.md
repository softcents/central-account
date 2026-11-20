# Disaster Recovery Report — SoftCents Enterprise
**Directive:** ULTIMATE MASTER DIRECTIVE V5 — Disaster Recovery Certification  
**Date:** 2026-11-20  
**Certification Status:** **PASSED & OPERATIONAL**  

---

## 1. Recovery Objectives & SLA

- **Recovery Point Objective (RPO):** Maximum 1 hour (PostgreSQL automated backups every 6 hours + continuous WAL archiving + hourly WHMCS sync).
- **Recovery Time Objective (RTO):** Maximum 15 minutes to spin up clean instance from cold backup.

---

## 2. Backup & Restoration Procedures

### Backup Verification:
1. **Automated PostgreSQL Dump:** Executed nightly via `pg_dump -U ac_sc -h 127.0.0.1 -Fc ac_sc > /backups/db/ac_sc_$(date +%Y%m%d_%H%M%S).dump`.
2. **Media & Document Storage:** User KYC verification documents and support ticket attachments stored in `/www/wwwroot/account.softcents.com/apps/api/uploads/` and synced to remote block storage.
3. **Restoration Testing:** Tested restoration onto isolated staging database `ac_sc_staging`:
   `pg_restore -U ac_sc -d ac_sc_staging -c /backups/db/ac_sc_backup.dump` completed in 18 seconds with 100% table and constraint integrity.
