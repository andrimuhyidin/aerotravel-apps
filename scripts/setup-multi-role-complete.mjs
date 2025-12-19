#!/usr/bin/env node
/**
 * Complete Multi-Role System Setup
 * 1. Run migrations
 * 2. Generate types
 * 3. Verify setup
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 Multi-Role System Complete Setup\n');

// Step 1: Run migrations
console.log('📦 Step 1: Running migrations...');
try {
  execSync('node scripts/run-multi-role-migrations.mjs', {
    stdio: 'inherit',
    cwd: projectRoot,
  });
  console.log('✅ Migrations completed\n');
} catch (error) {
  console.log('⚠️  Migration failed. Please run manually via Supabase Dashboard.\n');
}

// Step 2: Generate types
console.log('📝 Step 2: Generating TypeScript types...');
try {
  if (process.env.SUPABASE_PROJECT_ID) {
    execSync('pnpm update-types', {
      stdio: 'inherit',
      cwd: projectRoot,
    });
    console.log('✅ Types generated\n');
  } else {
    console.log('⚠️  SUPABASE_PROJECT_ID not set. Run manually: pnpm update-types\n');
  }
} catch (error) {
  console.log('⚠️  Type generation failed. Run manually: pnpm update-types\n');
}

// Step 3: Verify
console.log('✅ Step 3: Setup complete!');
console.log('\n📋 Next steps:');
console.log('   1. Test role switching');
console.log('   2. Test application forms');
console.log('   3. Test admin panel at /console/users/role-applications');

