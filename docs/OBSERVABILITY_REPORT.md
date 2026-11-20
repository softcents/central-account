# Observability & Monitoring Report — SoftCents Enterprise
**Directive:** ULTIMATE MASTER DIRECTIVE V5 — Observability & Monitoring Audit  
**Date:** 2026-11-20  

---

## 1. Observability Architecture

The platform incorporates end-to-end monitoring and telemetry:
- **Application Logging:** Structured Winston/NestJS logger emitting timestamped JSON logs with log levels (`LOG`, `WARN`, `ERROR`, `DEBUG`).
- **Web Server Access Logs:** Nginx combined log format capturing client IP, request method, URI, status code, latency, and user agent.
- **Audit Logs:** Dedicated database table `audit_logs` storing immutable event records for compliance and forensic analysis.
- **Health Check Endpoints:**
  - Next.js Web: `GET /` (HTTP 200 OK)
  - NestJS API: `GET /api/countries` (HTTP 200 OK)
  - Database: `SELECT 1` heartbeat on connection pool
  - Redis: `PING` -> `PONG` response
- **Alerting & Watchdog:** `scripts/watchdog.sh` polls port 3000 and port 4000 every 2 minutes and restarts automatically if any unhandled crash occurs.
