#!/usr/bin/env node
/**
 * Run Multi-Role System Migrations
 * Shows instructions for running migrations via Supabase Dashboard
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const MIGRATION_1 = join(projectRoot, 'supabase/migrations/20251221000000_029-multi-role-system.sql');
const MIGRATION_2 = join(projectRoot, 'supabase/migrations/20251221000001_030-multi-role-data-migration.sql');

console.log('🚀 Multi-Role System Migrations\n');
console.log('📋 Migration files ready:');
console.log(`   1. ${MIGRATION_1.split('/').pop()}`);
console.log(`   2. ${MIGRATION_2.split('/').pop()}\n`);

console.log('✅ Run migrations via Supabase Dashboard:');
console.log('   1. Open: https://supabase.com/dashboard');
console.log('   2. Go to SQL Editor');
console.log('   3. Copy & paste each migration file');
console.log('   4. Run each migration\n');

console.log('📝 After migrations, run: pnpm update-types\n');
