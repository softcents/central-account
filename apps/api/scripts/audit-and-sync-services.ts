import { PrismaClient, UserStatus, SubscriptionStatus, BillingCycle, PlanTier } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const SSH_CMD = "sshpass -p '#@Raju1' ssh -o StrictHostKeyChecking=no root@billing.softcents.com";

function queryTsv(query: string): any[] {
  // Write query to temporary remote file or escape carefully
  const escapedQuery = query.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$');
  const fullCmd = `${SSH_CMD} "mysql -u billing_softcents -pbilling_softcents billing_softcents -e \\"${escapedQuery}\\" -B"`;
  const output = execSync(fullCmd, { maxBuffer: 50 * 1024 * 1024, encoding: 'utf-8' });
  const lines = output.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split('\t');
  return lines.slice(1).map((line) => {
    const parts = line.split('\t');
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = parts[i] === 'NULL' ? null : parts[i];
    });
    return obj;
  });
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === '0000-00-00' || dateStr.startsWith('0000')) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function getPlanTier(groupName: string = '', productName: string = '', amount: number = 0): PlanTier {
  const g = groupName.toLowerCase();
  const p = productName.toLowerCase();
  if (amount >= 2500 || g.includes('dedicated') || p.includes('dedicated') || g.includes('corporate') || p.includes('corporate')) {
    return PlanTier.PRO;
  }
  if (amount >= 800 || g.includes('business') || p.includes('business') || g.includes('reseller') || p.includes('reseller')) {
    return PlanTier.BUSINESS;
  }
  if (amount > 0 || g.includes('basic') || p.includes('basic') || g.includes('standard') || p.includes('standard') || g.includes('sms') || g.includes('hosting')) {
    return PlanTier.STARTER;
  }
  return PlanTier.FREE;
}

async function run() {
  console.log('================================================================');
  console.log('   AUDITING & ACTIVATING WHMCS SERVICES BY DATE & CLIENT        ');
  console.log('================================================================');

  // 1. Fetch raw hosting services with products, groups, servers, and clients
  console.log('Fetching all services from billing.softcents.com...');
  const sql = `
    SELECT 
      h.id, 
      h.userid, 
      h.orderid,
      h.packageid,
      g.id as group_id,
      g.name as group_name, 
      p.name as product_name, 
      p.type as product_type,
      h.domain, 
      h.username,
      h.regdate, 
      h.nextduedate, 
      h.nextinvoicedate,
      h.domainstatus, 
      h.amount, 
      h.firstpaymentamount,
      h.billingcycle,
      h.paymentmethod,
      s.id as server_id,
      s.name as server_name,
      s.ipaddress as server_ip,
      c.firstname,
      c.lastname,
      c.companyname,
      c.email,
      c.phonenumber
    FROM tblhosting h
    LEFT JOIN tblclients c ON h.userid = c.id
    LEFT JOIN tblproducts p ON h.packageid = p.id
    LEFT JOIN tblproductgroups g ON p.gid = g.id
    LEFT JOIN tblservers s ON h.server = s.id
    ORDER BY h.regdate DESC, h.id DESC;
  `;

  const rawServices = queryTsv(sql);
  console.log(`✓ Fetched ${rawServices.length} total services from tblhosting.`);

  // 2. Fetch plans from Prisma
  const plans = await prisma.plan.findMany();
  const planMap: Record<PlanTier, any> = {} as any;
  plans.forEach(p => {
    planMap[p.code] = p;
  });

  // Ensure default plans exist
  for (const tier of [PlanTier.FREE, PlanTier.STARTER, PlanTier.BUSINESS, PlanTier.PRO, PlanTier.ENTERPRISE]) {
    if (!planMap[tier]) {
      const created = await prisma.plan.create({
        data: {
          code: tier,
          name: `${tier.charAt(0) + tier.slice(1).toLowerCase()} Tier`,
          price_monthly: tier === PlanTier.FREE ? 0 : tier === PlanTier.STARTER ? 29 : tier === PlanTier.BUSINESS ? 99 : 249,
          currency: 'BDT',
          features: ['Central Account Services'],
        },
      });
      planMap[tier] = created;
    }
  }

  // 3. Process each service date-wise and map to client
  console.log('\n--- DATE-WISE SERVICE AUDIT & ACTIVATION ---');
  let activeCount = 0;
  let suspendedCount = 0;
  let pendingCount = 0;
  let cancelledCount = 0;
  let terminatedCount = 0;
  let subsCreatedOrUpdated = 0;

  const enrichedServices: any[] = [];
  const clientActiveMap: Record<string, any[]> = {};

  for (const s of rawServices) {
    const rawStatus = (s.domainstatus || 'Active').trim();
    if (rawStatus === 'Active') activeCount++;
    else if (rawStatus === 'Suspended') suspendedCount++;
    else if (rawStatus === 'Pending') pendingCount++;
    else if (rawStatus === 'Cancelled') cancelledCount++;
    else if (rawStatus === 'Terminated') terminatedCount++;

    const clientFullName = `${s.firstname || ''} ${s.lastname || ''}`.trim() || s.companyname || s.email || `Client #${s.userid}`;
    const groupName = s.group_name || 'Services';
    const productName = s.product_name || `Service #${s.id}`;
    const fullPackageName = `${groupName} - ${productName}`;
    const regDate = s.regdate && s.regdate !== '0000-00-00' ? s.regdate : '2025-11-20';
    const regDateDisplay = formatDate(regDate);
    const nextDueDisplay = formatDate(s.nextduedate);

    const enriched = {
      id: s.id,
      userid: s.userid,
      orderid: s.orderid,
      packageid: s.packageid,
      group_name: groupName,
      product_name: productName,
      package: fullPackageName,
      domain: s.domain || s.username || '',
      username: s.username || '',
      regdate: regDate,
      regdate_display: regDateDisplay,
      date_activated: regDateDisplay,
      nextduedate: s.nextduedate || '',
      nextduedate_display: nextDueDisplay,
      domainstatus: rawStatus,
      amount: parseFloat(s.amount || '0').toFixed(2),
      firstpaymentamount: parseFloat(s.firstpaymentamount || '0').toFixed(2),
      billingcycle: s.billingcycle || 'Monthly',
      paymentmethod: s.paymentmethod || 'PipraPay',
      server_name: s.server_name || null,
      server_ip: s.server_ip || null,
      clientName: clientFullName,
      clientEmail: s.email || '',
      clientPhone: s.phonenumber || '',
      clientCompany: s.companyname || '',
    };

    enrichedServices.push(enriched);

    if (rawStatus === 'Active') {
      if (!clientActiveMap[s.userid]) clientActiveMap[s.userid] = [];
      clientActiveMap[s.userid].push(enriched);
    }

    // Now synchronize to PostgreSQL Prisma Database
    const email = (s.email || '').trim().toLowerCase();
    if (email && email.includes('@')) {
      try {
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              password_hash: '$2b$10$w8uQc7zL5jKk3F5f.vI8.uXv9cM1X0w6C2D6k0y0c2m',
              status: rawStatus === 'Suspended' ? UserStatus.SUSPENDED : UserStatus.ACTIVE,
              email_verified: true,
              email_verified_at: new Date(regDate),
              customer_registration_completed: true,
            },
          });
        }

        // Find or create Tenant for this client
        let tenant = await prisma.tenant.findFirst({
          where: { owner_id: user.id },
        });

        if (!tenant) {
          const slug = `client-${s.userid}-${user.id.slice(0, 8)}`;
          tenant = await prisma.tenant.create({
            data: {
              name: s.companyname || clientFullName || `Client #${s.userid}`,
              slug,
              status: 'ACTIVE',
              owner_id: user.id,
            },
          });
        }

        // Map status to SubscriptionStatus
        let subStatus: SubscriptionStatus = SubscriptionStatus.ACTIVE;
        if (rawStatus === 'Suspended') subStatus = SubscriptionStatus.PAST_DUE;
        else if (rawStatus === 'Cancelled') subStatus = SubscriptionStatus.CANCELLED;
        else if (rawStatus === 'Terminated') subStatus = SubscriptionStatus.EXPIRED;

        const cycle = (s.billingcycle || '').toLowerCase().includes('annual')
          ? BillingCycle.YEARLY
          : BillingCycle.MONTHLY;

        const planTier = getPlanTier(groupName, productName, parseFloat(s.amount || '0'));
        const chosenPlan = planMap[planTier] || planMap[PlanTier.STARTER];

        const startDate = new Date(regDate);
        let endDate: Date;
        if (s.nextduedate && s.nextduedate !== '0000-00-00') {
          endDate = new Date(s.nextduedate);
        } else {
          endDate = new Date(startDate);
          if (cycle === BillingCycle.YEARLY) endDate.setFullYear(endDate.getFullYear() + 1);
          else endDate.setMonth(endDate.getMonth() + 1);
        }

        const subId = `sub_whmcs_${s.id}`;
        await prisma.subscription.upsert({
          where: { id: subId },
          update: {
            status: subStatus,
            plan_id: chosenPlan.id,
            billing_cycle: cycle,
            current_period_start: startDate,
            current_period_end: endDate,
          },
          create: {
            id: subId,
            tenant_id: tenant.id,
            plan_id: chosenPlan.id,
            status: subStatus,
            billing_cycle: cycle,
            current_period_start: startDate,
            current_period_end: endDate,
            created_at: startDate,
          },
        });

        subsCreatedOrUpdated++;
      } catch (e: any) {
        console.error(`Error syncing service ${s.id} for user ${email}:`, e.message);
      }
    }
  }

  console.log(`\n================================================================`);
  console.log(`Audit Summary:`);
  console.log(`  - Total Services:    ${rawServices.length}`);
  console.log(`  - Active Services:   ${activeCount}`);
  console.log(`  - Suspended:         ${suspendedCount}`);
  console.log(`  - Pending:           ${pendingCount}`);
  console.log(`  - Cancelled:         ${cancelledCount}`);
  console.log(`  - Terminated:        ${terminatedCount}`);
  console.log(`  - Subscriptions DB:  ${subsCreatedOrUpdated} synced to PostgreSQL`);
  console.log(`================================================================\n`);

  // 4. Update apps/web/src/data/whmcs_sync.json
  const syncFilePath = '/www/wwwroot/account.softcents.com/apps/web/src/data/whmcs_sync.json';
  if (fs.existsSync(syncFilePath)) {
    const existing = JSON.parse(fs.readFileSync(syncFilePath, 'utf-8'));
    existing.services = enrichedServices;
    existing.serviceCount = enrichedServices.length;

    // Update clients array with exact active and total counts and active product names
    if (Array.isArray(existing.clients)) {
      existing.clients = existing.clients.map((c: any) => {
        const userServices = enrichedServices.filter((s: any) => String(s.userid) === String(c.id));
        const activeUserServices = userServices.filter((s: any) => s.domainstatus === 'Active');
        const activeCount = activeUserServices.length;
        const totalCount = userServices.length;
        const activeProducts = activeUserServices.map((s: any) => ({
          id: s.id,
          name: s.package,
          regdate: s.regdate,
          regdate_display: s.regdate_display,
          amount: s.amount,
          billingcycle: s.billingcycle,
        }));

        return {
          ...c,
          active_services: activeCount,
          total_services: totalCount,
          services_count: `${activeCount} (${totalCount})`,
          active_products: activeProducts,
        };
      });
    }

    fs.writeFileSync(syncFilePath, JSON.stringify(existing, null, 2));
    console.log(`✓ Updated ${syncFilePath} with enriched date-wise services and clients.`);
  }

  console.log('=== Service Date-Wise Verification & Activation Finished Successfully! ===');
}

run()
  .catch((e) => {
    console.error('Fatal error during service audit:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
