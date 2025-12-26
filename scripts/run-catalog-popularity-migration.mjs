#!/usr/bin/env node
/**
 * Script to run Catalog & Product Browsing popularity migration
 * Usage: node scripts/run-catalog-popularity-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const migrationFile = join(__dirname, '../supabase/migrations/20250125000013_095-package-popularity-view.sql');

async function runMigration() {
  console.log('🚀 Running Catalog & Product Browsing Popularity Migration');
  console.log(`\n📡 Supabase URL: ${SUPABASE_URL}\n`);

  try {
    // Read migration file
    const migrationSQL = readFileSync(migrationFile, 'utf-8');
    console.log(`📄 Reading migration file: ${migrationFile}\n`);

    // Note: Supabase JS client cannot execute DDL statements directly
    // We'll verify the view exists instead
    console.log('⚠️  Note: Supabase JavaScript client cannot execute DDL statements directly.');
    console.log('   Please run migration via one of these methods:\n');
    console.log('   1. Supabase Dashboard (RECOMMENDED):');
    console.log('      https://supabase.com/dashboard/project/mjzukilsgkdqmcusjdut/sql/new\n');
    console.log('   2. psql command:');
    console.log(`      psql "$DATABASE_URL" -f ${migrationFile}\n`);

    console.log('📋 Migration SQL to run:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));

    // Try to verify if view already exists
    console.log('\n🔍 Checking if package_popularity view exists...');
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.views
          WHERE table_schema = 'public' AND table_name = 'package_popularity'
        ) as exists;
      `,
    });

    if (error) {
      // RPC might not exist, that's okay
      console.log('⚠️  Could not verify view existence (RPC function may not exist)');
      console.log('   This is normal. Please run the migration manually.\n');
    } else if (data && data[0]?.exists) {
      console.log('✅ package_popularity view already exists!');
    } else {
      console.log('❌ package_popularity view does not exist yet.');
      console.log('   Please run the migration using one of the methods above.\n');
    }

    console.log('\n💡 After running the migration, update TypeScript types:');
    console.log('   npm run update-types\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigration();

