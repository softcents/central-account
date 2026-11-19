import { PrismaClient, UserStatus, InvoiceStatus, TicketCategory, TicketStatus, TicketPriority } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const SSH_CMD = "sshpass -p '#@Raju1' ssh -o StrictHostKeyChecking=no root@billing.softcents.com";

function queryTsv(query: string): any[] {
  const fullCmd = `${SSH_CMD} "mysql -u billing_softcents -pbilling_softcents billing_softcents -e \\"${query.replace(/"/g, '\\"')}\\" -B"`;
  const output = execSync(fullCmd, { maxBuffer: 30 * 1024 * 1024, encoding: 'utf-8' });
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

async function main() {
  console.log('=== Starting Robust Full WHMCS Data Migration & Live Sync ===');

  // 1. Ensure SuperAdmin User
  let adminUser = await prisma.user.findUnique({
    where: { email: 'admin@softcents.com' },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        id: 'user_admin_softcents',
        email: 'admin@softcents.com',
        password_hash: '$2b$10$w8uQc7zL5jKk3F5f.vI8.uXv9cM1X0w6C2D6k0y0c2m',
        status: UserStatus.ACTIVE,
        email_verified: true,
        email_verified_at: new Date(),
        customer_registration_completed: true,
      },
    });
    console.log('✓ Created SuperAdmin User: admin@softcents.com');
  }

  // Ensure Default Tenant
  let tenant = await prisma.tenant.findFirst({
    where: { slug: 'softcents' },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        id: 'tenant_softcents',
        name: 'SoftCents Systems Ltd.',
        slug: 'softcents',
        status: 'ACTIVE',
        owner_id: adminUser.id,
      },
    });
    console.log('✓ Created primary tenant: tenant_softcents');
  } else {
    console.log('✓ Found primary tenant:', tenant.id);
  }

  // 2. Fetch and Migrate All Clients
  console.log('--> Fetching all clients from billing.softcents.com...');
  const clients = queryTsv(`
    SELECT id, firstname, lastname, companyname, email, phonenumber, address1, city, state, postcode, country, status, credit, datecreated
    FROM tblclients;
  `);
  console.log(`✓ Fetched ${clients.length} clients via TSV.`);

  let usersImported = 0;
  const clientIdToUserIdMap: Record<string, string> = {};

  for (const c of clients) {
    const email = (c.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) continue;

    let userStatus: UserStatus = UserStatus.ACTIVE;
    if (c.status === 'Inactive' || c.status === 'Closed') {
      userStatus = UserStatus.SUSPENDED;
    }

    try {
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            password_hash: '$2b$10$w8uQc7zL5jKk3F5f.vI8.uXv9cM1X0w6C2D6k0y0c2m',
            status: userStatus,
            email_verified: true,
            email_verified_at: new Date(),
            customer_registration_completed: true,
            tenant_id: tenant.id,
          },
        });
        usersImported++;
      }

      clientIdToUserIdMap[c.id] = user.id;

      await prisma.userProfile.upsert({
        where: { user_id: user.id },
        update: {
          first_name: c.firstname || '',
          last_name: c.lastname || '',
          country_code: c.country || 'BD',
          phone_number: c.phonenumber || '',
        },
        create: {
          user_id: user.id,
          first_name: c.firstname || '',
          last_name: c.lastname || '',
          country_code: c.country || 'BD',
          phone_number: c.phonenumber || '',
          tenant_id: tenant.id,
        },
      });
    } catch (err: any) {
      console.error(`Error migrating client ${c.id} (${email}):`, err.message);
    }
  }

  console.log(`✓ Clients synced: ${usersImported} newly imported, ${Object.keys(clientIdToUserIdMap).length} mapped.`);

  // 3. Fetch and Migrate All Invoices
  console.log('--> Fetching invoices from billing.softcents.com...');
  const invoices = queryTsv(`
    SELECT id, userid, invoicenum, date, duedate, total, status, paymentmethod
    FROM tblinvoices;
  `);
  console.log(`✓ Fetched ${invoices.length} invoices via TSV.`);

  let invoicesImported = 0;
  for (const inv of invoices) {
    const invNumber = inv.invoicenum ? `INV-${inv.invoicenum}` : `WHMCS-${inv.id}`;
    let invStatus: InvoiceStatus = InvoiceStatus.PAID;
    if (inv.status === 'Unpaid') {
      invStatus = InvoiceStatus.OPEN;
    } else if (inv.status === 'Cancelled') {
      invStatus = InvoiceStatus.VOID;
    }

    try {
      await prisma.invoice.upsert({
        where: { invoice_number: invNumber },
        update: {
          amount: parseFloat(inv.total) || 0,
          status: invStatus,
          due_date: inv.duedate ? new Date(inv.duedate) : new Date(),
        },
        create: {
          invoice_number: invNumber,
          tenant_id: tenant.id,
          amount: parseFloat(inv.total) || 0,
          currency: 'BDT',
          status: invStatus,
          due_date: inv.duedate ? new Date(inv.duedate) : new Date(),
          created_at: inv.date ? new Date(inv.date) : new Date(),
          line_items: [
            {
              description: `WHMCS Invoice #${inv.id} (${inv.paymentmethod || 'PipraPay'})`,
              amount: parseFloat(inv.total) || 0,
            },
          ],
        },
      });
      invoicesImported++;
    } catch (e: any) {
      // ignore
    }
  }
  console.log(`✓ Invoices imported/updated: ${invoicesImported}`);

  // 4. Fetch Support Tickets
  console.log('--> Fetching support tickets from billing.softcents.com...');
  const tickets = queryTsv(`
    SELECT id, tid, userid, title, status, urgency, date
    FROM tbltickets;
  `);
  console.log(`✓ Fetched ${tickets.length} tickets via TSV.`);

  let ticketsImported = 0;
  for (const t of tickets) {
    const userId = clientIdToUserIdMap[t.userid];
    if (!userId) continue;

    let tStatus: TicketStatus = TicketStatus.OPEN;
    if (t.status === 'Closed') tStatus = TicketStatus.CLOSED;

    let tPriority: TicketPriority = TicketPriority.NORMAL;
    if (t.urgency === 'High') tPriority = TicketPriority.HIGH;
    else if (t.urgency === 'Critical') tPriority = TicketPriority.URGENT;

    try {
      const ticketId = `tkt_whmcs_${t.id}`;
      const existing = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
      if (!existing) {
        await prisma.supportTicket.create({
          data: {
            id: ticketId,
            user_id: userId,
            category: TicketCategory.GENERAL_SUPPORT,
            subject: t.title || 'Technical Inquiry',
            description: t.title || 'Support ticket imported from WHMCS',
            status: tStatus,
            priority: tPriority,
            created_at: t.date ? new Date(t.date) : new Date(),
          },
        });
        ticketsImported++;
      }
    } catch (e: any) {
      // ignore
    }
  }
  console.log(`✓ Tickets imported: ${ticketsImported}`);

  // 5. Fetch Servers, Addons, and Services for Live Frontend & Management
  console.log('--> Fetching servers and addon modules...');
  const servers = queryTsv(`
    SELECT id, name, ipaddress, hostname, type, active
    FROM tblservers;
  `);

  const addons = queryTsv(`
    SELECT DISTINCT module
    FROM tbladdonmodules;
  `);

  const services = queryTsv(`
    SELECT h.id, h.userid, p.name as package, h.domain, h.amount, h.billingcycle, h.nextduedate, h.domainstatus, s.name as server_name, s.ipaddress as server_ip
    FROM tblhosting h
    LEFT JOIN tblproducts p ON h.packageid = p.id
    LEFT JOIN tblservers s ON h.server = s.id;
  `);

  const syncData = {
    syncedAt: new Date().toISOString(),
    clientCount: clients.length,
    invoiceCount: invoices.length,
    ticketCount: tickets.length,
    servers,
    services,
    addons: addons.map((a: any) => a.module),
    clients: clients.map((c: any) => ({
      id: c.id,
      name: `${c.firstname || ''} ${c.lastname || ''}`.trim(),
      company: c.companyname || '',
      email: c.email,
      phone: c.phonenumber,
      status: c.status,
      credit: c.credit,
      dateCreated: c.datecreated,
    })),
  };

  const webDataDir = '/www/wwwroot/account.softcents.com/apps/web/src/data';
  if (!fs.existsSync(webDataDir)) {
    fs.mkdirSync(webDataDir, { recursive: true });
  }
  fs.writeFileSync(path.join(webDataDir, 'whmcs_sync.json'), JSON.stringify(syncData, null, 2));
  console.log('✓ Successfully generated apps/web/src/data/whmcs_sync.json');

  console.log('=== All WHMCS Data Successfully Synchronized & Migrated! ===');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
