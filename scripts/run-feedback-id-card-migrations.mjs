#!/usr/bin/env node
/**
 * Run Guide Feedback & ID Card Migrations
 * Attempts multiple methods: Supabase CLI, psql, or provides instructions
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_PROJECT_ID = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

const migrations = [
  {
    name: '036-guide-feedback-id-card-license',
    path: join(__dirname, '..', 'supabase/migrations/20250120000000_036-guide-feedback-id-card-license.sql'),
  },
  {
    name: '037-guide-feedback-id-card-menu-items',
    path: join(__dirname, '..', 'supabase/migrations/20250120000001_037-guide-feedback-id-card-menu-items.sql'),
  },
];

async function checkTablesExist() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return null;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const tablesToCheck = [
    'guide_feedbacks',
    'guide_feedback_attachments',
    'guide_id_cards',
    'guide_license_applications',
    'guide_document_verifications',
  ];

  try {
    // Try to query each table
    const results = {};
    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        results[table] = !error;
      } catch {
        results[table] = false;
      }
    }
    return results;
  } catch {
    return null;
  }
}

async function runViaPsql() {
  if (!DATABASE_URL) {
    return false;
  }

  try {
    // Check if psql is available
    execSync('which psql', { stdio: 'ignore' });
  } catch {
    return false;
  }

  console.log('📦 Running migrations via psql...\n');

  for (const migration of migrations) {
    if (!existsSync(migration.path)) {
      console.error(`❌ Migration file not found: ${migration.path}`);
      continue;
    }

    console.log(`   Running: ${migration.name}...`);
    try {
      execSync(`psql "${DATABASE_URL}" -f "${migration.path}"`, {
        stdio: 'inherit',
        cwd: join(__dirname, '..'),
      });
      console.log(`   ✅ ${migration.name} completed\n`);
    } catch (error) {
      console.log(`   ⚠️  ${migration.name} may have errors (some objects may already exist)\n`);
    }
  }

  return true;
}

async function runViaSupabaseCLI() {
  try {
    // Check if Supabase CLI is available
    execSync('which supabase', { stdio: 'ignore' });
  } catch {
    return false;
  }

  console.log('📦 Running migrations via Supabase CLI...\n');

  try {
    // Try to link project if not already linked
    try {
      execSync('supabase link --project-ref ' + SUPABASE_PROJECT_ID, {
        stdio: 'inherit',
        cwd: join(__dirname, '..'),
      });
    } catch {
      // Already linked or can't link, continue
    }

    // Push migrations
    execSync('supabase db push', {
      stdio: 'inherit',
      cwd: join(__dirname, '..'),
    });

    console.log('✅ Migrations pushed via Supabase CLI\n');
    return true;
  } catch (error) {
    console.log('⚠️  Supabase CLI push failed\n');
    return false;
  }
}

async function main() {
  console.log('🚀 Running Guide Feedback & ID Card Migrations\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL || 'Not set'}`);
  console.log(`🔑 Service Key: ${SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`💾 Database URL: ${DATABASE_URL ? '✅ Set' : '❌ Not set'}\n`);

  // First, check if tables already exist
  console.log('🔍 Checking if migrations are already applied...');
  const tableStatus = await checkTablesExist();
  
  if (tableStatus) {
    const allExist = Object.values(tableStatus).every(Boolean);
    const existingTables = Object.entries(tableStatus)
      .filter(([_, exists]) => exists)
      .map(([table]) => table);
    
    if (allExist) {
      console.log('✅ All tables already exist! Migrations appear to be applied.\n');
      console.log('📋 Existing tables:');
      existingTables.forEach(table => console.log(`   ✅ ${table}`));
      console.log('\n🎉 No action needed. Migrations are already applied.');
      return;
    } else if (existingTables.length > 0) {
      console.log('⚠️  Some tables exist, but not all. Partial migration detected.\n');
      console.log('📋 Existing tables:');
      existingTables.forEach(table => console.log(`   ✅ ${table}`));
      console.log('\n📋 Missing tables:');
      Object.entries(tableStatus)
        .filter(([_, exists]) => !exists)
        .forEach(([table]) => console.log(`   ❌ ${table}`));
      console.log('\n💡 Please run migrations to complete the setup.');
    }
  }

  // Try different methods
  console.log('\n🔄 Attempting to run migrations...\n');

  // Method 1: Supabase CLI
  if (await runViaSupabaseCLI()) {
    console.log('✅ Migrations completed via Supabase CLI');
    return;
  }

  // Method 2: psql
  if (await runViaPsql()) {
    console.log('✅ Migrations completed via psql');
    return;
  }

  // Method 3: Manual instructions
  console.log('⚠️  Automatic migration execution not available.\n');
  console.log('📋 Please run migrations manually:\n');
  console.log('   Option 1: Supabase Dashboard (Recommended)');
  console.log(`   1. Go to: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`);
  console.log('   2. Copy and paste the SQL from each migration file:');
  migrations.forEach(m => {
    console.log(`      - ${m.path}`);
  });
  console.log('   3. Run each migration\n');

  console.log('   Option 2: Supabase CLI');
  console.log('   1. Install: npm install -g supabase');
  console.log(`   2. Login: supabase login`);
  console.log(`   3. Link: supabase link --project-ref ${SUPABASE_PROJECT_ID}`);
  console.log('   4. Push: supabase db push\n');

  console.log('   Option 3: psql (if DATABASE_URL is set)');
  console.log('   1. Install psql: brew install postgresql (macOS)');
  migrations.forEach(m => {
    console.log(`   2. Run: psql "$DATABASE_URL" -f "${m.path}"`);
  });
}

main().catch(console.error);
