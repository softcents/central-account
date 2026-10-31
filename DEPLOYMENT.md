# Central Account Platform — Production Deployment & Dockerization Guide

> **Goal:** Guarantee that the production environment behaves **100% identically** to the tested local development environment ("Local == Production"), with zero environment drift, automated database synchronization, and seamless scalability.

---

## 1. Why Dockerization is Required for Production

In complex multi-service architectures like Central Account, running outside of Docker in production creates significant environmental drift risks:

| Local Environment (Windows) | Production Server (Linux Ubuntu/Debian) | Risk Without Docker | Resolution with Docker |
|---|---|---|---|
| Python 3.12 + MediaPipe / OpenCV | System Python & different C-libs (`glibc`, `libgl1`) | OpenCV / InsightFace crashes due to missing C++ shared libraries | Locked into official `python:3.12-slim` image with bundled system dependencies |
| Tesseract OCR binary in path | System Tesseract package differences | OCR text extraction fails on Linux | Installed directly via `apt-get install -y tesseract-ocr` in image |
| Redis in-memory execution | Redis background persistence settings | BullMQ job queue lost on server reboot | Redis 7 container with `--appendonly yes` writing to persistent Docker volume |
| Node.js 22 LTS | Node version mismatch | Module compatibility and ESM loader differences | Standardized on `node:22-alpine` multi-stage build |

**Conclusion:** Using Docker Compose guarantees that the exact OS libraries, Node runtime, Python ML stack, PostgreSQL database, and Redis cache run identically on any cloud provider (AWS, DigitalOcean, Hetzner, GCP, or a dedicated Linux server).

---

## 2. Containerized Services Architecture

The production environment consists of **5 interconnected services** orchestrated via `docker-compose.yml`:

```
                       [Internet Client]
                              │
                              ▼
                     ┌──────────────────┐
                     │   Nginx Proxy    │ (Port 80 / 443 SSL)
                     └────────┬─────────┘
                              │
               ┌──────────────┴──────────────┐
               │ /api                        │ / (Web & Admin)
               ▼                             ▼
    ┌──────────────────────┐      ┌──────────────────────┐
    │     NestJS API       │      │   Next.js Frontend   │
    │    (Node 22, 4000)   │      │    (Node 22, 3000)   │
    └──────────┬───────────┘      └──────────────────────┘
               │
        ┌──────┼──────────────┬──────────────┐
        │      │              │              │
        ▼      ▼              ▼              ▼
  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌────────────────┐
  │PostgreSQL│ │  Redis 7 │ │BullMQ Workers│ │ Python FastAPI │
  │    17    │ │(AOF Pers)│ │ (5 Concurrent│ │ (AI Biometrics│
  │          │ │          │ │   Queues)    │ │   Port 8000)   │
  └──────────┘ └──────────┘ └──────────────┘ └────────────────┘
```

1. **`postgres`:** PostgreSQL 17 Alpine with healthcheck and persistent volume `postgres_data`.
2. **`redis`:** Redis 7 with `--appendonly yes` for persistent BullMQ background jobs.
3. **`face-service`:** Python 3.12 FastAPI service with OpenCV, MediaPipe, InsightFace, and Tesseract OCR.
4. **`api`:** NestJS backend with Prisma, BullMQ queues/workers, KYC/KYB decision engine, and automatic startup database synchronization.
5. **`web`:** Next.js 14 production bundle serving the user portal and dedicated admin dashboard.
6. **`nginx` (Optional / Production):** Reverse proxy binding ports 80/443, routing `/api` to NestJS and `/` to Next.js.

---

## 3. Quickstart Production Deployment

### Step 1: Clone Repository on Production Server
```bash
git clone https://github.com/your-org/central-account.git
cd central-account
```

### Step 2: Configure Production Environment Variables
```bash
cp .env.production.example .env
nano .env
```
*Fill in your database password, domain name, and cryptographic JWT secrets.*

### Step 3: Launch Containers with Docker Compose
```bash
# Launch unified production stack
docker compose up -d --build
```

### Step 4: Verify Service Health
```bash
docker compose ps
```
All containers should display `healthy` / `Up`.

---

## 4. Mandatory Tasks OUTSIDE of the Codebase

To ensure production smoothness, security, and compliance, complete the following items outside the codebase:

### 1. Domain Names & DNS Setup
- Point your domain's **A / AAAA Record** to your production server IP address:
  - Example: `id.yourcompany.com` -> `123.45.67.89`

---

### 2. HTTPS / TLS SSL Certificate (CRITICAL FOR WEBCAM)
> [!CAUTION]
> **Webcam Security Policy:** Modern web browsers (Google Chrome, Apple Safari, Mozilla Firefox) **strictly block** access to `navigator.mediaDevices.getUserMedia` (the camera) over plain HTTP connections in production. The camera API will only activate on `https://` or `localhost`.
>
> If you deploy without SSL, users will receive a `Camera Permission Denied` error during Face Liveness checks.

#### Solution A: Free Let's Encrypt SSL via Certbot (Recommended)
```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d id.yourcompany.com
```

#### Solution B: Cloudflare Proxied SSL
1. Set SSL mode to **Full (Strict)** in Cloudflare dashboard.
2. Cloudflare automatically provides an edge SSL certificate and protects against DDoS attacks.

---

### 3. Server Hardware & Resource Sizing
The AI face service and background BullMQ OCR processors require adequate memory and CPU:

| Resource | Minimum for Staging | Recommended for Production (100+ daily KYC) |
|---|---|---|
| **vCPU** | 2 vCPUs | 4 vCPUs |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 30 GB SSD | 80 GB NVMe SSD |
| **OS** | Ubuntu 22.04 / 24.04 LTS | Ubuntu 24.04 LTS / Debian 12 |

---

### 4. Database Backups & Data Retention
Ensure regular automated backups of your PostgreSQL database:

```bash
# Example nightly automated backup cron job (/etc/cron.daily/backup-db)
docker exec central-account-postgres pg_dump -U postgres central_identity_prod > /var/backups/central_identity_$(date +%F).sql
```
Alternatively, use a managed database service (e.g. AWS RDS, DigitalOcean Managed PostgreSQL, Supabase).

---

### 5. Production Transactional Email Service
In development, emails without SMTP are logged to console. In production, configure a real transactional email provider in `.env`:
- **SendGrid, Amazon SES, Postmark, or Resend:**
  ```env
  SMTP_HOST=smtp.sendgrid.net
  SMTP_PORT=587
  SMTP_USER=apikey
  SMTP_PASS=your_production_sendgrid_api_key
  SMTP_FROM="Central Account Security" <noreply@yourcompany.com>
  ```

---

### 6. Private Object Storage (S3 / Cloudflare R2)
By default, uploaded ID documents are saved to private encrypted disk storage. For multi-server or cloud scalability:
- Provision an **AWS S3 bucket** or **Cloudflare R2** with private bucket policies (no public access).
- Configure S3 credentials in `.env`.
- Documents will be accessed exclusively via **time-limited presigned URLs (15-minute validity)** generated for authorized reviewers.

---

## 5. Verification Checklist Before Going Live

- [ ] All 5 Docker containers running (`docker compose ps`).
- [ ] HTTPS is active and browser displays a valid padlock icon.
- [ ] Browser camera test passes on mobile and desktop at `/identity/document` -> `/identity/face`.
- [ ] Super Admin logs in successfully at `/admin/login` (`admin@centralidentity.com`).
- [ ] Background BullMQ telemetry confirms `HEALTHY` status for all 5 queues at `/admin/queues`.
- [ ] Simulated or test email confirmation received in inbox.
- [ ] Webhook test ping successfully delivered to tenant test endpoint.
