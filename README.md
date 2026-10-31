# Central Account Platform

Enterprise Central Identity & Account Management Platform built with **Next.js 14**, **NestJS**, **Prisma ORM**, **PostgreSQL**, and **Redis**.

Repository: [https://github.com/softcents/central-account](https://github.com/softcents/central-account)

---

## 📋 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [aaPanel Full Deployment Guide (ধাপে ধাপে গাইড)](#-aapanel-full-deployment-guide)
   - [Step 1: aaPanel Prerequisites & Plugins](#step-1-aapanel-prerequisites--plugins)
   - [Step 2: Database Setup (PostgreSQL)](#step-2-database-setup-postgresql)
   - [Step 3: Clone Project & Setup Folders](#step-3-clone-project--setup-folders)
   - [Step 4: Environment Variables (.env)](#step-4-environment-variables-env)
   - [Step 5: Dependencies & Database Migration](#step-5-dependencies--database-migration)
   - [Step 6: Production Build](#step-6-production-build)
   - [Step 7: aaPanel Node.js Project Setup](#step-7-aapanel-nodejs-project-setup)
   - [Step 8: SSL (Let's Encrypt) & Nginx Proxy](#step-8-ssl-lets-encrypt--nginx-proxy)
   - [Step 9: System Bengali Fonts (Optional)](#step-9-system-bengali-fonts-optional)
3. [Updating the Project via Git (ভবিষ্যতে আপডেট করার নিয়ম)](#-updating-the-project-via-git)
4. [Docker Deployment (Alternative)](#-docker-deployment-alternative)

---

## 🏗 Architecture Overview

| Service | Technology | Port | aaPanel / Internal Path |
|---|---|---|---|
| **Frontend Web** | Next.js 14 (App Router, Tailwind) | `3000` | `apps/web` |
| **Backend API** | NestJS, Prisma, BullMQ | `4000` | `apps/api` |
| **Database** | PostgreSQL 14+ | `5432` | Database: `ac_sc` |
| **Cache & Queues**| Redis 6+ / 7+ | `6379` | `localhost:6379` |
| **Web Server** | Nginx (aaPanel) | `80`, `443` | Reverse Proxy to 3000 & 4000 |

---

## 🚀 aaPanel Full Deployment Guide

### Step 1: aaPanel Prerequisites & Plugins
aaPanel এর **App Store** থেকে নিচের সফটওয়্যারগুলো ইনস্টল করুন:
1. **Nginx** (v1.22 বা তার বেশি)
2. **Node.js Version Manager** (Node.js `v20.x`, `v22.x`, অথবা `v26.x` ইনস্টল করুন)
3. **PostgreSQL Manager** / Server
4. **Redis** (v6 বা v7)

---

### Step 2: Database Setup (PostgreSQL)
aaPanel এর **Databases** > **PostgreSQL** মেনু থেকে:
1. **Add Database** এ ক্লিক করুন।
2. **Database Name:** `ac_sc`
3. **Username:** `ac_sc`
4. **Password:** একটি স্ট্রং পাসওয়ার্ড দিন (যেমন: `YourStrongPasswordHere`)
5. PostgreSQL সার্ভিস রানিং আছে কিনা চেক করুন (`systemctl status postgresql`)।

---

### Step 3: Clone Project & Setup Folders
সার্ভারের টার্মিনালে রুট বা `rdpuser` হিসেবে চালান:

```bash
# প্রজেক্ট ডিরেক্টরিতে যান
cd /www/wwwroot

# রিপোজিটরি ক্লোন করুন
git clone git@github.com:softcents/central-account.git account.softcents.com

# ফোল্ডারে প্রবেশ করুন
cd /www/wwwroot/account.softcents.com

# পারমিশন ঠিক করুন
chown -R www:www /www/wwwroot/account.softcents.com
chmod -R 775 /www/wwwroot/account.softcents.com
```

---

### Step 4: Environment Variables (.env)

প্রজেক্টের ৩টি স্থানে `.env` ফাইল কনফিগার করতে হবে:

#### ১. Root `.env`
```bash
cp .env.example .env
nano .env
```
কনফিগারেশন:
```env
POSTGRES_USER=ac_sc
POSTGRES_PASSWORD=YourStrongPasswordHere
POSTGRES_DB=ac_sc

JWT_ACCESS_SECRET=your_jwt_access_secret_64chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_64chars
JWT_MFA_SECRET=your_jwt_mfa_secret_64chars

FRONTEND_URL=https://account.softcents.com
NEXT_PUBLIC_API_URL=/api

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
SMTP_FROM="Central Account <your_email@gmail.com>"
```

#### ২. Backend `.env` (`apps/api/.env`)
```bash
cp apps/api/.env.example apps/api/.env
nano apps/api/.env
```
কনফিগারেশন:
```env
NODE_ENV=production
PORT=4000
DATABASE_URL="postgresql://ac_sc:YourStrongPasswordHere@127.0.0.1:5432/ac_sc?schema=public"
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=your_jwt_access_secret_64chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_64chars
JWT_MFA_SECRET=your_jwt_mfa_secret_64chars

FRONTEND_URL=https://account.softcents.com
PYTHON_VERIFICATION_URL=http://localhost:8000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
SMTP_FROM="Central Account <your_email@gmail.com>"
```

#### ৩. Frontend `.env.local` (`apps/web/.env.local`)
```bash
echo "NEXT_PUBLIC_API_URL=/api" > apps/web/.env.local
```

---

### Step 5: Dependencies & Database Migration
সার্ভারের টার্মিনালে চালান:

```bash
cd /www/wwwroot/account.softcents.com

# সব ডিপেন্ডেন্সি ইনস্টল করুন
npm install

# প্রিজমা স্কিমা ডাটাবেসে সিঙ্ক করুন
npx prisma db push --schema=apps/api/prisma/schema.prisma

# ডাটাবেসে ইনিশিয়াল সিড ডেটা পুশ করুন
npx ts-node apps/api/prisma/seed.ts
```

---

### Step 6: Production Build
ফ্রন্টেন্ড এবং ব্যাকএন্ড বিল্ড করুন:

```bash
# ব্যাকএন্ড NestJS বিল্ড
npm run build --workspace=api

# ফ্রন্টেন্ড Next.js বিল্ড
npm run build --workspace=web
```

---

### Step 7: aaPanel Node.js Project Setup

1. aaPanel প্যানেলে লগইন করুন।
2. বাম পাশের মেনু থেকে **Website** > **Node project** ট্যাবে যান।
3. **Add Node project** বাটনে ক্লিক করুন:
   - **Path:** `/www/wwwroot/account.softcents.com`
   - **Project Name:** `account.softcents.com`
   - **Run Command:** `npm run start`
   - **Port:** `3000`
   - **Run Opt:** `start`
   - **Node Version:** আপনার ইনস্টল করা Node ভার্সন নির্বাচন করুন (v20+ / v22+ / v26+)
   - **Run User:** `www`
4. **Confirm / Submit** এ ক্লিক করুন।
5. প্রজেক্ট স্ট্যাটাস **Running** দেখাবে।

---

### Step 8: SSL (Let's Encrypt) & Nginx Proxy

#### ১. SSL সেটআপ:
1. aaPanel এর **Website** > **Node project** এ যান।
2. আপনার সাইটের নামের পাশে **SSL** এ ক্লিক করুন।
3. **Let's Encrypt** সিলেক্ট করে আপনার ডোমেইন সিলেক্ট করে **Apply** করুন।
4. সার্টিফিকেট ইস্যু হলে **Force HTTPS** অন করুন।

#### ২. Nginx কনফিগারেশন:
সাইটের **Config** এ যান এবং Nginx কনফিগারেশনে নিচের প্রক্সি রুলস নিশ্চিত করুন:

```nginx
# ফ্রন্টেন্ড Next.js (Port 3000)
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# ব্যাকএন্ড NestJS API (Port 4000)
location /api {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
কনফিগারেশন সেভ করে Nginx রিলোড করুন।

---

### Step 9: System Bengali Fonts (Optional)
যদি বাংলা ফন্ট বা NID OCR প্রসেসিং প্রয়োজন হয়:
```bash
mkdir -p /usr/share/fonts/truetype/bangla
# ফন্টগুলো ডাউনলোড বা কপি করে ক্যাশ রিফ্রেশ করুন:
fc-cache -fv
```

---

## 🔄 Updating the Project via Git

### সার্ভার থেকে গিটহাবে আপডেট পুশ করা:
কোডে কোনো পরিবর্তন আনলে সার্ভারের টার্মিনালে এক কমান্ডেই পুশ করতে পারেন:
```bash
/www/wwwroot/account.softcents.com/scripts/git-push.sh "আপনার আপডেট মেসেজ"
```

### গিটহাব থেকে সার্ভারে নতুন আপডেট নামানো ও রিবিল্ড করা:
```bash
cd /www/wwwroot/account.softcents.com

# গিট থেকে নতুন কোড টানুন
git pull origin main

# ডিপেন্ডেন্সি আপডেট (প্রয়োজনে)
npm install

# ডাটাবেজ স্কিমা আপডেট (প্রয়োজনে)
npx prisma db push --schema=apps/api/prisma/schema.prisma

# রিবিল্ড
npm run build --workspace=api
npm run build --workspace=web

# aaPanel থেকে সাইট রিস্টার্ট করুন অথবা:
# aaPanel Node project রিস্টার্ট বাটন চাপুন
```

---

## 🐳 Docker Deployment (Alternative)
Docker ব্যবহার করে চালাতে চাইলে [DEPLOYMENT.md](DEPLOYMENT.md) ফাইলটি দেখুন:
```bash
docker compose up -d --build
```
