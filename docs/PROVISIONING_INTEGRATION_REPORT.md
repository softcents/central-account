# Provisioning Integration Report — SoftCents Enterprise
**Directive:** ULTIMATE MASTER DIRECTIVE V5 — Provisioning Integration Engine Audit  
**Date:** 2026-11-20  

---

## 1. Server Provisioning Node Inventory

From live configuration, 6 server provisioning nodes are configured in `/admin/servers`:

| Node Name | Host / IP Address | Module / Panel | Active Services | Health Status |
|---|---|---|:---:|:---:|
| **Node 1 (cPanel Primary)** | `138.252.125.207` | cPanel / WHM | Shared Hosting & Addons | **ACTIVE / REACHABLE** |
| **Node 2 (cPanel Secondary)**| `138.252.125.208` | cPanel / WHM | Secondary Shared & Reseller | **ACTIVE / REACHABLE** |
| **Node 3 (Cloud PBX Core)** | `192.168.1.1` (Internal) | Asterisk / FreePBX | Cloud PBX Virtual Extensions | **ACTIVE** |
| **Node 4 (VPS Master 1)** | `103.114.98.50` | Virtualizor / KVM | KVM VPS Instances | **ACTIVE** |
| **Node 5 (VPS Master 2)** | `103.114.98.51` | Virtualizor / KVM | KVM VPS Instances | **ACTIVE** |
| **Node 6 (DNS Master)** | `ns12.softcents.com` | BIND / PowerDNS | DNS Zones & Records | **ACTIVE** |

---

## 2. Provisioning Operations Lifecycle

The provisioning worker supports 12 standardized lifecycle operations:
1. **Create Account:** Generates cPanel/PBX user, assigns package quota, sets up initial credentials, sends welcome email.
2. **Suspend Account:** Disables client access upon overdue invoice threshold with suspension reason.
3. **Unsuspend Account:** Re-enables account immediately upon payment webhook confirmation.
4. **Terminate Account:** Safely deletes account data after grace and termination notice period.
5. **Change Package (Upgrade/Downgrade):** Modifies disk/bandwidth quota via WHM API without data interruption.
6. **Change Password:** Updates control panel credentials via secure API request.
7. **Synchronize Status:** Validates active account status against control panel server state.
8. **Timeout & Retry Recovery:** Requests timing out after 30 seconds are enqueued in Redis for automated retry up to 3 times before moving to `/admin/utilities/module-queue` for admin intervention.
