import { PrismaClient, UserStatus, InvoiceStatus, TicketCategory, TicketStatus, TicketPriority } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const SSH_CMD = "sshpass -p '#@Raju1' ssh -o StrictHostKeyChecking=no root@billing.softcents.com";

function queryTsv(query: string): any[] {
  const sanitizedQuery = query.replace(/"/g, '\\"').replace(/`/g, '\\`');
  const fullCmd = `${SSH_CMD} "mysql -u billing_softcents -pbilling_softcents billing_softcents -e \\"${sanitizedQuery}\\" -B"`;
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
    SELECT id, firstname, lastname, companyname, email, phonenumber, address1, address2, city, state, postcode, country, status, credit, datecreated, tax_id, defaultgateway, billingcid, language, marketing_emails_opt_in, email_preferences
    FROM tblclients
    ORDER BY id DESC;
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
    SELECT id, userid, invoicenum, date, duedate, total, subtotal, credit, tax, status, paymentmethod, notes
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

  // 4. Fetch and Migrate Support Tickets
  console.log('--> Fetching support tickets from billing.softcents.com...');
  const ticketsRaw = queryTsv(`
    SELECT t.id, t.tid, t.userid, t.did, t.title, HEX(t.message) as msg_hex, t.status, t.urgency, t.date, t.lastreply, d.name as dept_name
    FROM tbltickets t
    LEFT JOIN tblticketdepartments d ON t.did = d.id;
  `);
  console.log(`✓ Fetched ${ticketsRaw.length} tickets via TSV.`);

  const tickets = ticketsRaw.map((t: any) => ({
    ...t,
    message: t.msg_hex ? Buffer.from(t.msg_hex, 'hex').toString('utf-8') : '',
  }));

  console.log('--> Fetching ticket replies from billing.softcents.com...');
  const ticketRepliesRaw = queryTsv(`
    SELECT r.id, r.tid, r.userid, r.name, r.email, r.date, r.admin, HEX(r.message) as msg_hex, r.attachment
    FROM tblticketreplies r
    ORDER BY r.date ASC;
  `);
  const ticketReplies = ticketRepliesRaw.map((r: any) => ({
    ...r,
    message: r.msg_hex ? Buffer.from(r.msg_hex, 'hex').toString('utf-8') : '',
  }));
  console.log(`✓ Fetched ${ticketReplies.length} ticket replies via TSV.`);

  let ticketsImported = 0;
  for (const t of tickets) {
    const userId = clientIdToUserIdMap[t.userid] || adminUser.id;
    let tStatus: TicketStatus = TicketStatus.OPEN;
    if (t.status === 'Closed') tStatus = TicketStatus.CLOSED;
    else if (t.status === 'In Progress') tStatus = TicketStatus.IN_REVIEW;

    let tPriority: TicketPriority = TicketPriority.NORMAL;
    if (t.urgency === 'High') tPriority = TicketPriority.HIGH;
    else if (t.urgency === 'Low') tPriority = TicketPriority.LOW;

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
            description: t.message || t.title || 'Support ticket imported from WHMCS',
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

  // 5. Fetch Services, Domains, Orders, Invoice Items, Transactions, Products, Servers, Addons, Cancellations, Contacts, Emails
  console.log('--> Fetching full services, domains, orders, transactions, product catalog, cancellations, contacts, emails...');
  const services = queryTsv(`
    SELECT 
      h.id, 
      h.userid, 
      h.orderid,
      h.packageid,
      g.id as group_id,
      g.name as group_name, 
      p.name as product_name, 
      CONCAT(IFNULL(g.name, ''), IF(g.name IS NOT NULL AND p.name IS NOT NULL, ' - ', ''), IFNULL(p.name, '')) as package,
      h.domain, 
      h.username, 
      h.amount, 
      h.firstpaymentamount,
      h.billingcycle, 
      h.nextduedate, 
      h.regdate, 
      h.domainstatus, 
      h.paymentmethod,
      h.dedicatedip,
      h.assignedips,
      h.ns1,
      h.ns2,
      h.diskusage,
      h.disklimit,
      h.bwusage,
      h.bwlimit,
      h.suspendreason,
      h.server,
      s.name as server_name, 
      s.ipaddress as server_ip,
      s.hostname as server_hostname,
      s.type as server_type
    FROM tblhosting h
    LEFT JOIN tblproducts p ON h.packageid = p.id
    LEFT JOIN tblproductgroups g ON p.gid = g.id
    LEFT JOIN tblservers s ON h.server = s.id
    ORDER BY h.regdate DESC, h.id DESC;
  `);

  const domains = queryTsv(`
    SELECT d.id, d.userid, d.domain, d.registrationperiod, d.firstpaymentamount, d.recurringamount, d.paymentmethod, d.registrationdate, d.expirydate, d.nextduedate, d.status, d.registrar, d.dnsmanagement, d.emailforwarding, d.idprotection, d.donotrenew
    FROM tbldomains d;
  `);

  const cancellationRequests = queryTsv(`
    SELECT c.id, c.date, c.relid, c.reason, c.type, h.userid, h.domain, p.name as product_name, CONCAT(cl.firstname, ' ', cl.lastname) as client_name
    FROM tblcancelrequests c
    LEFT JOIN tblhosting h ON c.relid = h.id
    LEFT JOIN tblproducts p ON h.packageid = p.id
    LEFT JOIN tblclients cl ON h.userid = cl.id
    ORDER BY c.id DESC;
  `);

  const contacts = queryTsv(`
    SELECT id, userid, firstname, lastname, companyname, email, address1, address2, city, state, postcode, country, phonenumber, subaccount, permissions
    FROM tblcontacts;
  `);

  console.log('--> Fetching client email history from billing.softcents.com...');
  const emailsRaw = queryTsv(`
    SELECT e.id, e.userid, e.subject, e.date, e.to as recipient, HEX(e.message) as msg_hex
    FROM tblemails e
    ORDER BY e.id DESC
    LIMIT 500;
  `);
  const emails = emailsRaw.map((e: any) => ({
    ...e,
    message: e.msg_hex ? Buffer.from(e.msg_hex, 'hex').toString('utf-8') : '',
  }));
  console.log(`✓ Fetched ${emails.length} client emails.`);

  const orders = queryTsv(`
    SELECT o.id, o.ordernum, o.userid, o.date, o.amount, o.paymentmethod, o.status
    FROM tblorders o;
  `);

  const invoiceItems = queryTsv(`
    SELECT id, invoiceid, userid, type, relid, description, amount, taxed
    FROM tblinvoiceitems;
  `);

  const transactions = queryTsv(`
    SELECT a.id, a.userid, a.date, a.description, a.amountin, a.fees, a.amountout, a.transid, a.invoiceid, a.gateway
    FROM tblaccounts a;
  `);

  const productGroups = queryTsv(`
    SELECT id, name, slug, headline, tagline, hidden, tblproductgroups.order
    FROM tblproductgroups
    ORDER BY tblproductgroups.order, id;
  `);

  const products = queryTsv(`
    SELECT 
      p.id, 
      p.gid, 
      g.name as group_name,
      g.slug as group_slug,
      g.headline as group_headline,
      g.tagline as group_tagline,
      g.hidden as group_hidden,
      g.order as group_order,
      p.name as product_name, 
      p.type, 
      p.description, 
      p.paytype,
      p.retired,
      p.hidden as product_hidden,
      p.order as product_order,
      pr.msetupfee,
      pr.qsetupfee,
      pr.ssetupfee,
      pr.asetupfee,
      pr.monthly, 
      pr.quarterly, 
      pr.semiannually, 
      pr.annually, 
      pr.biennially, 
      pr.triennially
    FROM tblproducts p
    LEFT JOIN tblproductgroups g ON p.gid = g.id
    LEFT JOIN tblpricing pr ON pr.relid = p.id AND pr.type = 'product'
    ORDER BY g.order, g.id, p.order, p.id;
  `);

  console.log('--> Fetching server infrastructure and clusters from billing.softcents.com...');
  const serversRaw = queryTsv(`
    SELECT id, name, ipaddress, assignedips, hostname, monthlycost, noc, statusaddress, nameserver1, nameserver1ip, nameserver2, nameserver2ip, nameserver3, nameserver3ip, nameserver4, nameserver4ip, nameserver5, nameserver5ip, maxaccounts, type, username, secure, port, active, disabled
    FROM tblservers
    ORDER BY id ASC;
  `);

  const serverGroupsRaw = queryTsv(`
    SELECT id, name, filltype
    FROM tblservergroups;
  `);

  const serverGroupRels = queryTsv(`
    SELECT id, groupid, serverid
    FROM tblservergroupsrel;
  `);

  const serverGroups = serverGroupsRaw.map((g: any) => ({
    ...g,
    servers: serverGroupRels.filter((r: any) => String(r.groupid) === String(g.id)).map((r: any) => r.serverid),
  }));

  const servers = serversRaw.map((s: any) => {
    const assignedServices = services.filter((srv: any) => String(srv.server) === String(s.id) || (String(s.id) === '1' && (!srv.server || srv.server === '0')));
    return {
      ...s,
      activeAccounts: assignedServices.length,
      maxaccounts: s.maxaccounts || '200',
      port: s.port || (s.secure === 'on' ? (s.type === 'cpanel' ? '2087' : '443') : (s.type === 'cpanel' ? '2086' : '80')),
    };
  });
  console.log(`✓ Fetched ${servers.length} servers and ${serverGroups.length} server groups.`);

  console.log('--> Fetching addon modules from billing.softcents.com...');
  const addonModulesRaw = queryTsv(`
    SELECT module, setting, value
    FROM tbladdonmodules;
  `);

  const addonSettingsMap: Record<string, Record<string, string>> = {};
  for (const row of addonModulesRaw) {
    if (!addonSettingsMap[row.module]) {
      addonSettingsMap[row.module] = {};
    }
    addonSettingsMap[row.module][row.setting] = row.value || '';
  }

  const addons = Object.keys(addonSettingsMap).map((moduleName) => ({
    module: moduleName,
    settings: addonSettingsMap[moduleName],
    version: addonSettingsMap[moduleName]['version'] || '1.0',
    access: addonSettingsMap[moduleName]['access'] || '1,2,3',
  }));
  console.log(`✓ Fetched ${addons.length} active addon modules with full configurations.`);

  console.log('--> Fetching client custom fields from billing.softcents.com...');
  const clientCustomFields = queryTsv(`
    SELECT id, fieldname, fieldtype, description, fieldoptions, required, sortorder
    FROM tblcustomfields
    WHERE type = 'client' AND (adminonly IS NULL OR adminonly = '' OR adminonly != 'on')
    ORDER BY sortorder, id;
  `);

  console.log('--> Fetching client custom field values from billing.softcents.com...');
  const clientCustomFieldValues = queryTsv(`
    SELECT v.id, v.fieldid, v.relid as clientid, v.value
    FROM tblcustomfieldsvalues v
    JOIN tblcustomfields f ON v.fieldid = f.id
    WHERE f.type = 'client';
  `);
  console.log(`✓ Fetched ${clientCustomFields.length} custom fields and ${clientCustomFieldValues.length} field values.`);

  const customFieldMap: Record<string, Record<string, string>> = {};
  for (const val of clientCustomFieldValues) {
    if (!customFieldMap[val.clientid]) {
      customFieldMap[val.clientid] = {};
    }
    const fieldDef = clientCustomFields.find((f: any) => String(f.id) === String(val.fieldid));
    if (fieldDef) {
      customFieldMap[val.clientid][fieldDef.fieldname] = val.value || '';
      customFieldMap[val.clientid][`field_${val.fieldid}`] = val.value || '';
    }
  }

  // Build client lookup map
  const clientMap: Record<string, string> = {};
  clients.forEach((c: any) => {
    clientMap[c.id] = `${c.firstname || ''} ${c.lastname || ''}`.trim() || c.companyname || c.email;
  });

  const syncData = {
    syncedAt: new Date().toISOString(),
    clientCount: clients.length,
    serviceCount: services.length,
    domainCount: domains.length,
    orderCount: orders.length,
    invoiceCount: invoices.length,
    transactionCount: transactions.length,
    ticketCount: tickets.length,
    productCount: products.length,
    servers,
    serverGroups,
    addons,
    addonSettingsMap,
    gateways: [
      {
        id: 'piprapay',
        name: 'PipraPay Payment Gateway (bKash / Nagad / Cards)',
        visible: true,
        type: 'Invoices',
        baseUrl: 'https://epay.softcents.com/api',
        apiKey: 'b3e91bb98e0d874acb860272f240000b48a47368010ed81017',
        currency: 'BDT',
        version: 'V3+',
      },
      {
        id: 'banktransfer',
        name: 'Direct Bank Transfer / Cash',
        visible: true,
        type: 'Invoices',
        instructions: 'City Bank / BRAC Bank SoftCents Systems Account',
      },
    ],
    clients: clients.map((c: any) => {
      const activeSvc = services.filter((s: any) => String(s.userid) === String(c.id) && s.domainstatus === 'Active').length;
      const totalSvc = services.filter((s: any) => String(s.userid) === String(c.id)).length;
      let emailPrefs = {
        general: 1,
        invoice: 1,
        support: 1,
        product: 1,
        domain: 1,
        affiliate: 1,
      };
      if (c.email_preferences) {
        try {
          emailPrefs = typeof c.email_preferences === 'string' ? JSON.parse(c.email_preferences) : c.email_preferences;
        } catch {}
      }

      return {
        id: c.id,
        firstname: c.firstname || '',
        lastname: c.lastname || '',
        name: `${c.firstname || ''} ${c.lastname || ''}`.trim() || c.companyname || c.email,
        company: c.companyname || '',
        companyname: c.companyname || '',
        email: c.email || '',
        phone: c.phonenumber || '',
        phonenumber: c.phonenumber || '',
        address1: c.address1 || '',
        address2: c.address2 || '',
        city: c.city || '',
        state: c.state || '',
        postcode: c.postcode || '',
        country: c.country || 'BD',
        tax_id: c.tax_id || '',
        defaultgateway: c.defaultgateway || '',
        billingcid: c.billingcid || '0',
        language: c.language || '',
        marketing_emails_opt_in: c.marketing_emails_opt_in === '1' || c.marketing_emails_opt_in === 1 || c.marketing_emails_opt_in === true,
        email_preferences: emailPrefs,
        customfields: customFieldMap[c.id] || {},
        status: c.status || 'Active',
        credit: c.credit || '0.00',
        dateCreated: c.datecreated || '',
        datecreated: c.datecreated || '',
        active_services: activeSvc,
        total_services: totalSvc,
        services_count: `${activeSvc} (${totalSvc})`,
      };
    }),
    clientCustomFields,
    services: services.map((s: any) => ({
      ...s,
      clientName: clientMap[s.userid] || `Client #${s.userid}`,
    })),
    domains: domains.map((d: any) => ({
      ...d,
      clientName: clientMap[d.userid] || `Client #${d.userid}`,
    })),
    orders: orders.map((o: any) => ({
      ...o,
      clientName: clientMap[o.userid] || `Client #${o.userid}`,
    })),
    invoices: invoices.map((inv: any) => ({
      ...inv,
      clientName: clientMap[inv.userid] || `Client #${inv.userid}`,
      items: invoiceItems.filter((item: any) => String(item.invoiceid) === String(inv.id)),
    })),
    transactions: transactions.map((t: any) => ({
      ...t,
      clientName: clientMap[t.userid] || `Client #${t.userid}`,
    })),
    tickets: tickets.map((t: any) => ({
      ...t,
      clientName: clientMap[t.userid] || `Client #${t.userid}`,
      replies: ticketReplies.filter((r: any) => String(r.tid) === String(t.id)),
    })),
    ticketReplies,
    cancellationRequests,
    contacts,
    emails,
    productGroups,
    products,
  };

  const webDataDir = '/www/wwwroot/account.softcents.com/apps/web/src/data';
  if (!fs.existsSync(webDataDir)) {
    fs.mkdirSync(webDataDir, { recursive: true });
  }
  fs.writeFileSync(path.join(webDataDir, 'whmcs_sync.json'), JSON.stringify(syncData, null, 2));
  console.log('✓ Successfully generated comprehensive apps/web/src/data/whmcs_sync.json');

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
