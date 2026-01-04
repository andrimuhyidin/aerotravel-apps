#!/usr/bin/env node
/**
 * Migration via Supabase Client Library
 * Run: node lib/scripts/migrate-direct.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env.local
const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Direct Migration Executor\n');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const migrations = [
  {
    file: 'supabase/migrations/20250225000013_121-package-reviews-system.sql',
    name: '121 - Package Reviews System',
  },
  {
    file: 'supabase/migrations/20250225000014_122-analytics-ab-testing-feedback.sql',
    name: '122 - Analytics & Feedback',
  },
];

// Since Supabase doesn't allow executing raw DDL SQL via client library,
// we'll print instructions for manual execution

console.log('📋 MIGRATION INSTRUCTIONS\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('⚠️  Supabase requires migrations to be run via SQL Editor.\n');
console.log('🔗 Dashboard URL:');
console.log(`   https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new\n`);

console.log('📝 Please execute these migrations in order:\n');

migrations.forEach((migration, index) => {
  console.log(`${index + 1}. ${migration.name}`);
  console.log(`   File: ${migration.file}`);
  console.log(`   Steps:`);
  console.log(`     a. Open SQL Editor in Supabase Dashboard`);
  console.log(`     b. Copy content from: ${migration.file}`);
  console.log(`     c. Paste and click "Run"`);
  console.log(`     d. Verify success\n`);
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Let's at least verify connection works
console.log('🔍 Testing database connection...\n');

supabase
  .from('packages')
  .select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('❌ Connection failed:', error.message);
    } else {
      console.log(`✅ Connection successful! (Found ${count} packages)`);
      console.log('\n💡 Please proceed with manual migration as instructed above.\n');
    }
  });

