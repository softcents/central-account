# Complete Page Inventory — SoftCents Billing Platform
**Reference Platform:** `https://billing.softcents.com/`  
**Target Platform:** `https://account.softcents.com/`  
**Generated At:** 2026-11-20  

---

## 1. Admin Console Pages (`/admin/*`)

### 1.1. Dashboard & Core Navigation
| Page Route | Legacy WHMCS File | Target URL | Primary Features & Actions |
|---|---|---|---|
| **Admin Login** | `admin/login.php` | `/admin/login` | Email/Username, Password, 2FA MFA Verification, Remember Me |
| **Admin Dashboard** | `admin/index.php` | `/admin/dashboard` | Income statistics, Pending orders, Active services, Ticket queue, Quick Whois lookup, New client modal, Left shortcut navigation |
| **Global Search** | `admin/search.php` | `/admin/clients` | Search by client name, email, phone, domain, invoice #, service ID |

### 1.2. Clients Management (`/admin/clients/*`)
| Page Route | Legacy WHMCS File | Target URL | Primary Features & Actions |
|---|---|---|---|
| **View Clients** | `admin/clients.php` | `/admin/clients` | Client list (168 clients), status filters, balance, quick links to profile and impersonation login |
| **Client Summary** | `admin/clientssummary.php` | `/admin/clients/[id]` | WHMCS 4-column summary, billing statistics, profile edit, quick actions (Add Order, Create Invoice, KYC Module, Login as Client) |
| **Client Services** | `admin/clientsservices.php` | `/admin/clients/[id]?tab=services` | Tabbed view of client's specific PBX & hosting packages, server node, billing cycle, price, due date |
| **Client Domains** | `admin/clientsdomains.php` | `/admin/clients/[id]?tab=domains` | Tabbed view of client's registered domains, registrar, expiry date, autorenew toggle |
| **Client Invoices** | `admin/clientsinvoices.php` | `/admin/clients/[id]?tab=invoices` | Complete invoice history for the client, payment status, view invoice link |
| **Client Transactions** | `admin/clientstransactions.php` | `/admin/clients/[id]?tab=transactions` | Financial ledger: amount in, fees, gateway, txn ID |
| **Client Tickets** | `admin/supporttickets.php` | `/admin/clients/[id]?tab=tickets` | Support tickets opened by client, department, status, priority |
| **Client KYC / Identity** | `admin/addonmodules.php?module=advanced_client_verification` | `/admin/clients/[id]?tab=kyc` | NID / Passport inspection, face similarity score, verify / reject actions |
| **Add New Client** | `admin/clientsadd.php` | `/admin/clients/add` | Manual client onboarding form (Name, Company, Email, Phone, Address, Currency) |
| **Services List** | `admin/clientshostinglist.php` | `/admin/clients/services` | Global list of all 149 provisioned services, server filters, status badges |
| **Domains List** | `admin/clientsdomainlist.php` | `/admin/clients/domains` | Global list of all 10 registered domains, registrar info, expiry tracker |
| **Cancellation Requests** | `admin/cancelrequests.php` | `/admin/clients/cancellations` | Review customer service cancellation requests |
| **Affiliates Program** | `admin/affiliates.php` | `/admin/clients/affiliates` | Commission tracking, referral payouts, affiliate activation |

### 1.3. Orders & Billing Management
| Page Route | Legacy WHMCS File | Target URL | Primary Features & Actions |
|---|---|---|---|
| **Orders List** | `admin/orders.php` | `/admin/orders` | 164 Orders list, order numbers, payment method, order date, status |
| **Add New Order** | `admin/ordersadd.php` | `/admin/orders/add` | Create manual order for a client, choose package, pricing, billing cycle, generate invoice |
| **Invoices Hub** | `admin/invoices.php` | `/admin/invoices` | 464 Invoices list, Paid/Unpaid/Cancelled tabs, total amount, print view |
| **Invoice Detail / Edit** | `admin/invoices.php?action=edit` | `/admin/invoices/[id]` | Add line items, apply credit, add payment, refund, send reminder |
| **Transactions Ledger** | `admin/transactions.php` | `/admin/transactions` | 269 Transactions, gateway breakdown, fee deduction, total revenue |
| **Gateway Log** | `admin/gatewaylog.php` | `/admin/billing/gateway-log` | Raw IPN / webhook payloads from PipraPay, bKash, and banks |
| **Billable Items** | `admin/billableitems.php` | `/admin/billing/billable-items` | Post-paid usage charges, one-time fees for next invoice |
| **Offline Processing** | `admin/offlineccprocessing.php` | `/admin/billing/offline-cc` | Manual credit card / bank slip verification |

### 1.4. Support & Tickets
| Page Route | Legacy WHMCS File | Target URL | Primary Features & Actions |
|---|---|---|---|
| **Support Tickets** | `admin/supporttickets.php` | `/admin/support` | 29 Tickets list, department filters, status badges, view/reply modal |
| **Open New Ticket** | `admin/supporttickets.php?action=open` | `/admin/support/open` | Open staff ticket on behalf of a client |
| **Predefined Replies** | `admin/supportticketpredefinedreplies.php` | `/admin/support/predefined-replies` | Canned responses for fast customer service |
| **Announcements** | `admin/supportannouncements.php` | `/admin/support/announcements` | Public service announcements and maintenance notices |
| **Knowledgebase** | `admin/supportkb.php` | `/admin/support/kb` | 445 Knowledgebase articles editor and categories |
| **Downloads Center** | `admin/supportdownloads.php` | `/admin/support/downloads` | Softphone software, SIP configurations, PBX apps |

### 1.5. Utilities & System Operations
| Page Route | Legacy WHMCS File | Target URL | Primary Features & Actions |
|---|---|---|---|
| **WHMCS Live Sync** | Custom Sync Engine | `/admin/utilities/whmcs-sync` | 1-Click remote synchronization with `billing.softcents.com` |
| **Activity Log** | `admin/systemactivitylog.php` | `/admin/utilities/activity-log` | Audit trail of all client logins, invoice generations, service modifications |
| **Automation Status** | `admin/automationstatus.php` | `/admin/utilities/automation-status` | Daily cron run status, invoice generation log, suspension log |
| **System Cleanup** | `admin/systemcleanup.php` | `/admin/utilities/cleanup` | Purge expired sessions, empty cache, clean orphaned records |
| **Database Operations** | `admin/systemdatabase.php` | `/admin/utilities/database` | Database size, table optimization, schema health |
| **PHP Info** | `admin/systemphpinfo.php` | `/admin/utilities/phpinfo` | Runtime environment details, ionCube status, extensions |
| **To-Do List** | `admin/todolist.php` | `/admin/utilities/todo` | Internal staff task assignment and status tracking |
| **WHOIS Lookup** | `admin/whois.php` | `/admin/utilities/whois` | Domain availability, registrar, nameservers, expiration dates |

### 1.6. System Configuration & Setup
| Page Route | Legacy WHMCS File | Target URL | Primary Features & Actions |
|---|---|---|---|
| **General Settings** | `admin/configgeneral.php` | `/admin/settings?tab=general` | Company name, logo, URLs, timezone, language, default currency |
| **Administrators & Roles** | `admin/configadmins.php` | `/admin/settings?tab=admins` | Staff accounts, Super Admin, KYC Reviewer, Support Agent roles |
| **Automation Rules** | `admin/configauto.php` | `/admin/settings?tab=automation` | Invoicing days (10 days), Suspension (0 days), Termination (300 days) |
| **Payment Gateways** | `admin/configgateways.php` | `/admin/settings?tab=gateways` | PipraPay (API Key, Base URL, Version), Bank Wire Transfer |
| **Provisioning Servers** | `admin/configservers.php` | `/admin/servers` | 6 Provisioning nodes (`srv8`, `srv111`, etc.), test connection, load balancing |
| **Addon Modules Hub** | `admin/addonmodules.php` | `/admin/addons` | 24 Addon modules management, activation, permissions |
| **Products & Services** | `admin/configproducts.php` | `/admin/settings` | 25 Product groups, 282 products, pricing tiers |

---

## 2. Client Portal Pages (`/clientarea/*`)

| Page Route | Legacy WHMCS File | Target URL | Primary Features & Actions |
|---|---|---|---|
| **Client Home** | `clientarea.php` | `/clientarea` | Dashboard overview: Active services count, Unpaid invoices count, Open tickets, Credit balance, Quick shortcuts |
| **My Services** | `clientarea.php?action=services` | `/clientarea/services` | Active hosting, PBX, and IP numbers list, next due dates, server info, manage button |
| **My Domains** | `clientarea.php?action=domains` | `/clientarea/domains` | Registered domains list, registrar, auto-renewal status, DNS management |
| **My Invoices** | `clientarea.php?action=invoices` | `/clientarea/invoices` | Invoice history, status (Paid/Unpaid), direct link to `/viewinvoice` and PipraPay |
| **Add Funds / Deposit** | `clientarea.php?action=addfunds` | `/clientarea/addfunds` | Enter deposit amount (Min ৳10, Max ৳50,000), choose PipraPay / Bank, instant checkout |
| **Support Tickets** | `supporttickets.php` | `/clientarea/tickets` | View tickets, open new ticket, view replies from technical engineers |
| **User Profile** | `clientarea.php?action=details` | `/clientarea/profile` | Update contact info, phone number, address, company name |
| **Account Security** | `clientarea.php?action=security` | `/clientarea/security` | Change password, configure 2FA Multi-Factor Authentication, active sessions |
| **Customer Registration**| `register.php` | `/customer-registration` | Multi-step BTRC telecom compliant registration form |

---

## 3. Product Ordering & Cart Pages (`/cart/*`)

| Page Route | Legacy WHMCS File | Target URL | Primary Features & Actions |
|---|---|---|---|
| **Shopping Cart Hub** | `cart.php` | `/cart` | Interactive catalog with 25 product groups |
| **Cloud PBX** | `cart.php?gid=2` | `/cart?group=pbx` | Standard PBX, Business PBX, Enterprise PBX, Corporate PBX, Dedicated PBX |
| **Shared Hosting** | `cart.php?gid=3` | `/cart?group=hosting` | USA Advance Linux Shared Hosting (2GB, 5GB, 10GB, 20GB) with cPanel & SSL |
| **BDIX Hosting** | `cart.php?gid=6` | `/cart?group=bdix` | Ultra-low latency BDIX Shared Hosting (2GB, 5GB, 10GB, 20GB) |
| **Bulk SMS** | `cart.php?gid=4` | `/cart?group=sms` | IP to SMS packages (Basic, Standard, Business, Bulk offers) |
| **IP Phone Numbers** | `cart.php?gid=5` | `/cart?group=ipphone` | 0961X, 09644, 09639 IP Phone number allocation |
| **Cloud VPS Servers** | `cart.php?gid=9..13` | `/cart?group=vps` | VPS in USA, UK, Germany (DE), France (FR), and Bangladesh (BD) |
| **Dedicated Servers** | `cart.php?gid=14` | `/cart?group=dedicated` | High-performance BDIX Bare-Metal Dedicated Servers |
| **Domain Registration**| `cart.php?a=add&domain=register` | `/cart?domain=register` | TLD domain search (.com, .net, .org, .com.bd, .xyz), pricing, cart checkout |
| **Domain Transfer** | `cart.php?a=add&domain=transfer` | `/cart?domain=transfer` | Outbound domain transfer with EPP auth code verification |
| **Checkout & Payment** | `cart.php?a=checkout` | `/cart` | Instant checkout connecting directly to PipraPay gateway |

---

## 4. Public & Transaction Pages

| Page Route | Legacy WHMCS File | Target URL | Primary Features & Actions |
|---|---|---|---|
| **Public Invoice View**| `viewinvoice.php?id=X` | `/viewinvoice?id=X` | Clean WHMCS invoice layout, watermark stamp (PAID / UNPAID), line items, Print Invoice, instant PipraPay checkout |
| **Knowledgebase** | `knowledgebase.php` | `/support/kb` | 445 Knowledgebase articles for self-service technical support |
| **Announcements** | `announcements.php` | `/support/announcements`| Company alerts and network updates |
| **Contact Us** | `contact.php` | `/support/new` | Public inquiry contact form |
| **Payment API** | `modules/gateways/callback/piprapay.php` | `/api/payment/checkout` & `/api/payment/webhook` | Real-time payment link generator & IPN confirmation |
