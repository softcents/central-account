import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = 'E:\\Softcents Systems\\central-identity';
const artifactDir = 'C:\\Users\\asus\\.gemini\\antigravity-ide\\brain\\ae82df94-1657-4e37-8ac1-c822c621b096';
const stagingDir = path.join(rootDir, 'staging_phases_1_2_3');

const filesToPackage = [
  'apps/api/prisma/schema.prisma',
  'apps/api/prisma/migrations/20261022000000_phase1_tenant_customer_and_domains/migration.sql',
  'apps/api/src/app.module.ts',
  'apps/api/src/common/decorators/current-tenant.decorator.ts',
  'apps/api/src/common/decorators/tenant-roles.decorator.ts',
  'apps/api/src/common/guards/tenant-isolation.guard.ts',
  'apps/api/src/common/middleware/tenant-domain.middleware.ts',
  'apps/api/src/common/utils/encryption.util.ts',
  'apps/api/src/common/utils/encryption.util.spec.ts',
  'apps/api/src/modules/billing/billing.controller.ts',
  'apps/api/src/modules/billing/billing.service.ts',
  'apps/api/src/modules/identity/identity.module.ts',
  'apps/api/src/modules/identity/review.controller.ts',
  'apps/api/src/modules/identity/services/job-queue.service.ts',
  'apps/api/src/modules/tenant/dto/tenant.dto.ts',
  'apps/api/src/modules/tenant/tenant.controller.ts',
  'apps/api/src/modules/tenant/tenant.module.ts',
  'apps/api/src/modules/tenant/tenant.service.ts',
  'apps/web/src/app/organizations/[id]/page.tsx',
  'scripts/validate-phases-1-2-3.mjs',
];

console.log('Preparing staging directory for ZIP packaging...');

if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

for (const relPath of filesToPackage) {
  const src = path.join(rootDir, relPath);
  const dest = path.join(stagingDir, relPath);

  if (!fs.existsSync(src)) {
    console.error(`ERROR: Source file does not exist: ${src}`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${relPath}`);
}

const zipFileName = 'central-identity-full-implementation-phases-1-2-3.zip';
const zipPathRoot = path.join(rootDir, zipFileName);
const zipPathArtifact = path.join(artifactDir, zipFileName);

if (fs.existsSync(zipPathRoot)) {
  fs.unlinkSync(zipPathRoot);
}

console.log(`\nCompressing files into ${zipFileName}...`);
// Use PowerShell Compress-Archive
execSync(
  `powershell -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipPathRoot}' -Force"`,
  { stdio: 'inherit' }
);

console.log(`ZIP created successfully at: ${zipPathRoot}`);

// Copy to artifact directory
fs.copyFileSync(zipPathRoot, zipPathArtifact);
console.log(`ZIP copied to artifact directory at: ${zipPathArtifact}`);

// Verify zip size
const stats = fs.statSync(zipPathRoot);
console.log(`ZIP file size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);

// Cleanup staging dir
fs.rmSync(stagingDir, { recursive: true, force: true });
console.log('Staging cleanup complete.');
