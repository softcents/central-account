# 🛡️ Multi-Software VPS Safety & aaPanel Operation Guidelines
**গুরুত্বপূর্ণ সার্ভার নিরাপত্তা ও অপারেশন নির্দেশিকা (Important Safety Rules)**

---

## ⚠️ CRITICAL WARNING / সতর্কবার্তা
এই VPS সার্ভারে **Central Account** ছাড়াও একাধিক লাইভ সফটওয়্যার ও প্রোডাকশন প্রজেক্ট চলছে (যেমন: **smsagri.softcents.com** [Go application, Port 8080], Python Apps, অন্যান্য সার্ভিস)।

সার্ভারে কোনো কাজ বা ডিপ্লয়মেন্ট করার সময় **কখনোই কোনো গ্লোবাল কিল বা গ্লোবাল কনফিগ পরিবর্তন করা যাবে না**, যাতে অন্য কোনো সফটওয়্যারের কোনো ক্ষতি বা ডাউনটাইম না ঘটে। সমস্ত প্রজেক্ট **aaPanel** এর মাধ্যমে নিরাপদে পরিচালিত হয়।

---

## 📌 ১. প্রজেক্ট ও পোর্ট আইসোলেশন (Port Isolation)

| Software / Project | Type | Ports | Webroot / Location | Safe Operation |
|---|---|---|---|---|
| **Central Account (Web)** | Next.js 14 | `3000` | `/www/wwwroot/account.softcents.com/apps/web` | শুধু এই পোর্টের প্রসেস রিস্টার্ট হবে |
| **Central Account (API)** | NestJS | `4000` | `/www/wwwroot/account.softcents.com/apps/api` | শুধু এই পোর্টের প্রসেস রিস্টার্ট হবে |
| **SMS Agri (Go App)** | Go Binary | `8080` | `/www/wwwroot/smsagri.softcents.com` | **🚫 কোনোভাবেই স্পর্শ করা যাবে না** |
| **PostgreSQL** | Database | `5432` | Shared DB Server | শুধু `ac_sc` ডাটাবেজে কাজ হবে |
| **Redis** | In-Memory Cache | `6379` | Shared Redis Server | সেন্ট্রাল অ্যাকাউন্ট কী-স্পেস ব্যবহার করবে |
| **aaPanel System** | Web GUI Control | `7800` | `/www/server/panel` | সিস্টেম ফাইল পরিবর্তন নিষিদ্ধ |

---

## 🚫 ২. যে কাজগুলো কখনোই করা যাবে না (STRICT DONT'S)

1. **🚫 `pkill -f node` বা `killall node` চালানো সম্পূর্ণ নিষিদ্ধ:**
   সার্ভারে অন্য নোড বা ব্যাকগ্রাউন্ড সার্ভিস চলতে পারে। কখনো গ্লোবাল কিল কমান্ড দেওয়া যাবে না।
2. **🚫 অন্য প্রজেক্টের ডিরেক্টরি বা প্রসেস টাচ করা নিষিদ্ধ:**
   `/www/wwwroot/smsagri.softcents.com` বা অন্যান্য ফোল্ডারে কোনো পরিবর্তন বা প্রসেস বন্ধ করা যাবে না।
3. **🚫 গ্লোবাল Nginx কনফিগারেশন নষ্ট করা নিষিদ্ধ:**
   সার্ভারের মেইন Nginx কনফিগ (`/www/server/nginx/conf/nginx.conf`) কখনো সরাসরি মুছে বা রিলোড ছাড়া টেস্ট না করে পরিবর্তন করা যাবে না। শুধু সেন্ট্রাল অ্যাকাউন্টের vhost (`/www/server/panel/vhost/nginx/account.softcents.com.conf`) পরিবর্তন করা যাবে।
4. **🚫 ডাটাবেজ ড্রপ বা ফ্লাশ করা নিষিদ্ধ:**
   `DROP DATABASE`, `FLUSHALL` (Redis) কমান্ড কখনো রান করা যাবে না। এতে অন্য সফটওয়্যারের ডাটা মুছে যেতে পারে।
5. **🚫 সার্ভার রিবুট (Reboot) দেওয়া যাবে না:**
   অপ্রয়োজনে সার্ভার রিবুট দিলে অন্যান্য সব লাইভ সফটওয়্যার বন্ধ হয়ে যাবে।

---

## ✅ ৩. সেন্ট্রাল অ্যাকাউন্ট নিরাপদভাবে রিস্টার্ট ও পরিচালনার নিয়ম (SAFE OPERATIONS)

### ক. aaPanel ড্যাশবোর্ড থেকে পরিচালনা (সর্বোত্তম পদ্ধতি):
1. **aaPanel** এ লগইন করুন।
2. **Website** > **Node project** মেনুতে যান।
3. `account.softcents.com` প্রজেক্টটির পাশে **Restart** বাটন চাপুন।
4. aaPanel স্বয়ংক্রিয়ভাবে স্ক্রিপ্ট `/www/server/nodejs/vhost/scripts/account.softcents.com.sh` এর মাধ্যমে পোর্ট ৩০০০ ও ৪০০০ নিরাপদভাবে রিস্টার্ট করবে।

### খ. টার্মিনাল/কমান্ড লাইন থেকে নিরাপদ রিস্টার্ট (Safe CLI Restart):
যদি টার্মিনালে কোনো কারণে সেন্ট্রাল অ্যাকাউন্ট রিস্টার্ট করতে হয়, **কেবলমাত্র নির্ধারিত পোর্ট দুটিকে টার্গেট করুন**:

```bash
# শুধুমাত্র পোর্ট ৩০০০ এবং ৪০০০ বন্ধ করা (অন্য কোনো সফটওয়্যার আক্রান্ত হবে না)
fuser -k 3000/tcp 4000/tcp

# ব্যাকএন্ড API চালু করা (NestJS - Port 4000)
cd /www/wwwroot/account.softcents.com/apps/api
nohup node dist/main.js > /www/wwwroot/account.softcents.com/apps/api/api.log 2>&1 &

# ফ্রন্টএন্ড Web চালু করা (Next.js - Port 3000)
cd /www/wwwroot/account.softcents.com/apps/web
PORT=3000 nohup npm run start > /www/wwwroot/account.softcents.com/apps/web/web.log 2>&1 &
```

---

## 🔄 ৪. গিট আপডেট ও পুশ নিয়ম (Git Workflow)

যেকোনো পরিবর্তন গিটহাবে পুশ করতে:
```bash
/www/wwwroot/account.softcents.com/scripts/git-push.sh "আপনার আপডেট বার্তা"
```

গিট থেকে নতুন কোড সার্ভারে নামাতে:
```bash
cd /www/wwwroot/account.softcents.com
git pull origin main
npm run build --workspace=api
npm run build --workspace=web
fuser -k 3000/tcp 4000/tcp
# এরপর aaPanel থেকে Restart দিন
```

---

## 🔒 ৫. ফাইল পারমিশন সতর্কতা (Permissions)
aaPanel ওয়েব সার্ভার সাধারণত `www:www` ইউজার দ্বারা পরিচালিত হয়:
```bash
chown -R www:www /www/wwwroot/account.softcents.com
chmod -R 775 /www/wwwroot/account.softcents.com
```
