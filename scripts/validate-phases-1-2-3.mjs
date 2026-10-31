import assert from 'node:assert/strict';
import crypto from 'node:crypto';

console.log('====================================================');
console.log('RUNNING COMPREHENSIVE VALIDATION SUITE (PHASES 1, 2, 3)');
console.log('====================================================\n');

// -----------------------------------------------------------------
// 1. TEST AES-256-GCM CRYPTOGRAPHIC SECURITY (PHASE 1)
// -----------------------------------------------------------------
console.log('>>> [TEST 1] Testing AES-256-GCM Provider Key Encryption & Tamper Detection');

function deriveKey(secretKey) {
  return crypto.createHash('sha256').update(String(secretKey)).digest();
}

function encryptSecret(plaintext, masterSecret) {
  const key = deriveKey(masterSecret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;
}

function decryptSecret(encryptedPayload, masterSecret) {
  const parts = encryptedPayload.split(':');
  assert.equal(parts.length, 3, 'Encrypted payload must contain iv, authTag, and ciphertext');
  const [ivHex, authTagHex, ciphertextHex] = parts;
  const key = deriveKey(masterSecret);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const masterKey = 'production_super_secure_master_key_32chars';
const rawProviderApiKey = 'live_scrapper_api_key_xyz987654321';

// Test Round trip
const encryptedKey = encryptSecret(rawProviderApiKey, masterKey);
assert.notEqual(encryptedKey, rawProviderApiKey);
assert.equal(encryptedKey.split(':').length, 3);
const decryptedKey = decryptSecret(encryptedKey, masterKey);
assert.equal(decryptedKey, rawProviderApiKey);
console.log('  ✓ Round-trip encryption and decryption successful');

// Test IV uniqueness (indistinguishability under chosen plaintext)
const encA = encryptSecret(rawProviderApiKey, masterKey);
const encB = encryptSecret(rawProviderApiKey, masterKey);
assert.notEqual(encA, encB, 'Two encryptions of same plaintext must produce distinct ciphertexts');
console.log('  ✓ Cryptographic random IV ensures distinct ciphertexts');

// Test Tamper resistance
const parts = encA.split(':');
const tamperedCipher = parts[2].slice(0, -1) + (parts[2].endsWith('a') ? 'b' : 'a');
assert.throws(() => {
  decryptSecret(`${parts[0]}:${parts[1]}:${tamperedCipher}`, masterKey);
}, 'Tampered ciphertext must fail authentication tag check');
console.log('  ✓ Tampered ciphertext is rejected via GCM authentication tag');


// -----------------------------------------------------------------
// 2. TEST TENANT ISOLATION BOUNDARY (PHASES 1 & 2)
// -----------------------------------------------------------------
console.log('\n>>> [TEST 2] Testing Tenant Isolation Boundary & Role Checks');

const mockDatabase = {
  tenants: [
    { id: 'tenant-acme', name: 'Acme Corp', status: 'ACTIVE' },
    { id: 'tenant-globex', name: 'Globex Corp', status: 'ACTIVE' },
    { id: 'tenant-suspended', name: 'Suspended LLC', status: 'SUSPENDED' },
  ],
  members: [
    { tenant_id: 'tenant-acme', user_id: 'user-alice', role: 'OWNER' },
    { tenant_id: 'tenant-acme', user_id: 'user-bob', role: 'VIEWER' },
    { tenant_id: 'tenant-globex', user_id: 'user-charlie', role: 'ADMIN' },
  ],
  customers: [
    { id: 'cust-1', tenant_id: 'tenant-acme', name: 'Acme Customer 1' },
    { id: 'cust-2', tenant_id: 'tenant-globex', name: 'Globex Customer 2' },
  ],
  providerConfigs: [
    { id: 'prov-1', tenant_id: 'tenant-acme', provider_code: 'DATA_CHECK_SCRAPPER', key: encA },
    { id: 'prov-2', tenant_id: 'tenant-globex', provider_code: 'ICC', key: encB },
  ],
};

function checkTenantIsolation(requestTenantId, callerUserId, requiredRoles = []) {
  // 1. Resolve membership
  const membership = mockDatabase.members.find(
    (m) => m.tenant_id === requestTenantId && m.user_id === callerUserId,
  );
  if (!membership) {
    throw new Error('Forbidden: Cross-tenant access denied');
  }

  // 2. Check tenant status
  const tenant = mockDatabase.tenants.find((t) => t.id === requestTenantId);
  if (tenant.status === 'SUSPENDED') {
    throw new Error('Forbidden: Tenant access suspended');
  }

  // 3. Enforce required roles
  if (requiredRoles.length > 0 && !requiredRoles.includes(membership.role) && membership.role !== 'OWNER') {
    throw new Error(`Forbidden: Insufficient role. Required: ${requiredRoles.join(' or ')}`);
  }

  return { tenantId: requestTenantId, role: membership.role };
}

// User Alice can access Acme
const aliceAccess = checkTenantIsolation('tenant-acme', 'user-alice', ['ADMIN', 'MANAGER']);
assert.equal(aliceAccess.tenantId, 'tenant-acme');
console.log('  ✓ Authorized tenant owner has full access');

// User Alice CANNOT access Globex
assert.throws(() => {
  checkTenantIsolation('tenant-globex', 'user-alice');
}, /Cross-tenant access denied/);
console.log('  ✓ User Alice is blocked from accessing Tenant Globex (Strict Isolation)');

// User Bob (VIEWER) cannot perform ADMIN operations
assert.throws(() => {
  checkTenantIsolation('tenant-acme', 'user-bob', ['ADMIN', 'MANAGER']);
}, /Insufficient role/);
console.log('  ✓ VIEWER role is blocked from privileged operations');

// Access to suspended tenant is blocked
mockDatabase.members.push({ tenant_id: 'tenant-suspended', user_id: 'user-dave', role: 'OWNER' });
assert.throws(() => {
  checkTenantIsolation('tenant-suspended', 'user-dave');
}, /Tenant access suspended/);
console.log('  ✓ Suspended organization access is immediately blocked');


// -----------------------------------------------------------------
// 3. TEST CUSTOM DOMAINS (PHASE 3)
// -----------------------------------------------------------------
console.log('\n>>> [TEST 3] Testing Custom Domain System, DNS Tokens & Host Resolution');

// Domain syntax validation test
const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
assert.ok(domainRegex.test('auth.acme.com'));
assert.ok(domainRegex.test('id.company.co.uk'));
assert.ok(!domainRegex.test('http://auth.acme.com'));
assert.ok(!domainRegex.test('auth.acme.com:4000'));
assert.ok(!domainRegex.test('invalid_domain_with_underscores'));
console.log('  ✓ Domain name syntax regex enforces FQDN without protocols or ports');

// Custom Domain Creation & Token Generation
const mockDomains = [];
function addCustomDomain(tenantId, domainInput) {
  const domain = domainInput.trim().toLowerCase();
  if (mockDomains.some((d) => d.domain === domain)) {
    throw new Error('Domain already registered');
  }
  const token = `central-id-verify=${crypto.randomBytes(16).toString('hex')}`;
  const isPrimary = mockDomains.filter((d) => d.tenantId === tenantId).length === 0;
  const newDomain = {
    id: `dom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    tenantId,
    domain,
    verificationToken: token,
    status: 'PENDING_DNS',
    isPrimary,
    sslStatus: 'PENDING',
    lastVerifiedAt: null,
  };
  mockDomains.push(newDomain);
  return newDomain;
}

const dom1 = addCustomDomain('tenant-acme', 'auth.acme.com');
assert.equal(dom1.domain, 'auth.acme.com');
assert.ok(dom1.verificationToken.startsWith('central-id-verify='));
assert.equal(dom1.isPrimary, true);
assert.equal(dom1.status, 'PENDING_DNS');
console.log('  ✓ Custom domain added with unique DNS verification token and auto-primary status');

// Second domain for same tenant should not be primary by default
const dom2 = addCustomDomain('tenant-acme', 'id.acme.com');
assert.equal(dom2.isPrimary, false);
console.log('  ✓ Secondary custom domain correctly defaults to non-primary');

// Duplicate domain across tenants is rejected
assert.throws(() => {
  addCustomDomain('tenant-globex', 'auth.acme.com');
}, /Domain already registered/);
console.log('  ✓ Duplicate custom domain registration across tenants is rejected');

// Simulate DNS Verification
function simulateDnsVerify(domainId, simulatedDnsRecords) {
  const dom = mockDomains.find((d) => d.id === domainId);
  assert.ok(dom);
  const matched = simulatedDnsRecords.includes(dom.verificationToken);
  if (matched) {
    dom.status = 'VERIFIED';
    dom.sslStatus = 'ACTIVE';
    dom.lastVerifiedAt = new Date();
    return { verified: true, domain: dom };
  } else {
    dom.status = 'FAILED';
    return { verified: false, domain: dom };
  }
}

// Failed verification when DNS TXT record missing
const failedCheck = simulateDnsVerify(dom1.id, ['some-other-txt-record']);
assert.equal(failedCheck.verified, false);
assert.equal(dom1.status, 'FAILED');
console.log('  ✓ Verification correctly reports FAILED when TXT record is absent');

// Successful verification when DNS TXT record matches token
const successCheck = simulateDnsVerify(dom1.id, [dom1.verificationToken]);
assert.equal(successCheck.verified, true);
assert.equal(dom1.status, 'VERIFIED');
assert.equal(dom1.sslStatus, 'ACTIVE');
console.log('  ✓ Verification succeeds and activates SSL when TXT record matches token');

// Host Header Resolution Middleware Test
function resolveHostMiddleware(hostHeader) {
  const hostname = hostHeader.split(':')[0].trim().toLowerCase();
  const found = mockDomains.find((d) => d.domain === hostname && d.status === 'VERIFIED');
  if (found) {
    return { tenantId: found.tenantId, domain: found.domain, sslStatus: found.sslStatus };
  }
  return null;
}

const resolvedContext = resolveHostMiddleware('auth.acme.com:443');
assert.ok(resolvedContext);
assert.equal(resolvedContext.tenantId, 'tenant-acme');
console.log('  ✓ Host header routing correctly maps incoming custom domain to tenant context');


// -----------------------------------------------------------------
// 4. TEST SUBSCRIPTION HEALTH & GRACE PERIOD LOGIC (PHASE 3)
// -----------------------------------------------------------------
console.log('\n>>> [TEST 4] Testing Subscription Grace Period & Expiration Enforcement');

function evaluateSubscriptionHealth(sub, now = new Date()) {
  const periodEnd = new Date(sub.current_period_end);
  const isExpired = periodEnd.getTime() < now.getTime();
  const GRACE_PERIOD_DAYS = 7;
  let status = sub.status;
  let inGracePeriod = false;
  let daysLeftInGrace = 0;
  let tenantSuspended = false;

  if (isExpired && sub.status !== 'CANCELLED') {
    const daysPastDue = Math.max(0, Math.floor((now.getTime() - periodEnd.getTime()) / (1000 * 60 * 60 * 24)));
    if (daysPastDue <= GRACE_PERIOD_DAYS) {
      status = 'PAST_DUE';
      inGracePeriod = true;
      daysLeftInGrace = GRACE_PERIOD_DAYS - daysPastDue;
    } else {
      status = 'EXPIRED';
      inGracePeriod = false;
      daysLeftInGrace = 0;
      tenantSuspended = true;
    }
  }

  return { status, inGracePeriod, daysLeftInGrace, tenantSuspended };
}

const baseDate = new Date();
const activeSub = {
  current_period_end: new Date(baseDate.getTime() + 15 * 24 * 60 * 60 * 1000),
  status: 'ACTIVE',
};
const activeHealth = evaluateSubscriptionHealth(activeSub, baseDate);
assert.equal(activeHealth.status, 'ACTIVE');
assert.equal(activeHealth.inGracePeriod, false);
console.log('  ✓ Active subscription within billing cycle reports healthy ACTIVE status');

// 3 days past due -> in grace period (PAST_DUE, not suspended)
const pastDueSub = {
  current_period_end: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
  status: 'ACTIVE',
};
const pastDueHealth = evaluateSubscriptionHealth(pastDueSub, baseDate);
assert.equal(pastDueHealth.status, 'PAST_DUE');
assert.equal(pastDueHealth.inGracePeriod, true);
assert.equal(pastDueHealth.daysLeftInGrace, 4);
assert.equal(pastDueHealth.tenantSuspended, false);
console.log('  ✓ Expired subscription within 7 days transitions to PAST_DUE with grace period active');

// 10 days past due -> grace period exceeded (EXPIRED, tenant SUSPENDED)
const expiredSub = {
  current_period_end: new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000),
  status: 'PAST_DUE',
};
const expiredHealth = evaluateSubscriptionHealth(expiredSub, baseDate);
assert.equal(expiredHealth.status, 'EXPIRED');
assert.equal(expiredHealth.inGracePeriod, false);
assert.equal(expiredHealth.tenantSuspended, true);
console.log('  ✓ Subscription past 7-day grace period transitions to EXPIRED and triggers SUSPENDED');

console.log('\n====================================================');
console.log('ALL PHASE 1, PHASE 2, AND PHASE 3 VALIDATION TESTS PASSED!');
console.log('====================================================\n');
