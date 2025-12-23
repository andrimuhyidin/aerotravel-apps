/**
 * Apply missing migrations for metrics implementation
 * - pre_trip_assessments table
 * - incident_reports table (if base table doesn't exist)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTableExists(tableName) {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      );
    `,
  });

  // Alternative: Try direct query
  const { error: queryError } = await supabase.from(tableName).select('id').limit(1);
  return !queryError;
}

async function runSQL(sql) {
  // Use Supabase REST API to execute SQL
  // Note: This requires using the service role key
  try {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.length === 0) continue;

      // Use Supabase REST API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({ query: statement }),
      });

      if (!response.ok) {
        // Try alternative: direct SQL execution via PostgREST
        // For now, we'll use a workaround
        console.log(`   ⚠️  Statement may need manual execution`);
      }
    }
  } catch (error) {
    console.error(`   ❌ Error executing SQL: ${error.message}`);
    throw error;
  }
}

async function applyMigration(migrationFile) {
  console.log(`\n📦 Applying migration: ${migrationFile}`);
  const migrationPath = join(__dirname, '..', migrationFile);
  const sql = readFileSync(migrationPath, 'utf-8');

  // Extract table names from SQL
  const tableMatch = sql.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
  const tableName = tableMatch ? tableMatch[1] : null;

  if (tableName) {
    const exists = await checkTableExists(tableName);
    if (exists) {
      console.log(`   ✅ Table ${tableName} already exists, skipping...`);
      return true;
    }
  }

  // For Supabase, we need to use the SQL Editor or CLI
  // Since we can't execute arbitrary SQL via REST API easily,
  // we'll provide instructions
  console.log(`   📝 Migration SQL prepared`);
  console.log(`   💡 Please run this migration via Supabase Dashboard:`);
  console.log(`      File: ${migrationFile}`);
  console.log(`      Or use Supabase CLI: supabase db push`);

  return false;
}

async function main() {
  console.log('🚀 Applying Metrics Implementation Migrations\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);

  // Check current status
  console.log('🔍 Checking current database status...\n');

  const tablesToCheck = {
    'pre_trip_assessments': 'supabase/migrations/20250123000007_050-pre-trip-risk-assessment.sql',
    'incident_reports': 'supabase/migrations/20250123000009_052-incident-reports-signature-notify.sql',
  };

  const status = {};
  for (const [tableName, migrationFile] of Object.entries(tablesToCheck)) {
    const exists = await checkTableExists(tableName);
    status[tableName] = { exists, migrationFile };
    console.log(`   ${exists ? '✅' : '❌'} ${tableName}: ${exists ? 'exists' : 'missing'}`);
  }

  // Check if incident_reports base table exists (migration 052 only adds columns)
  const { error: incidentBaseError } = await supabase
    .from('incident_reports')
    .select('id')
    .limit(1);

  if (incidentBaseError && incidentBaseError.code === '42P01') {
    console.log('\n   ⚠️  incident_reports base table does not exist');
    console.log('   💡 Need to find/create base incident_reports table first');
  }

  // Apply missing migrations
  console.log('\n📦 Applying missing migrations...\n');

  const migrationsToApply = [];
  for (const [tableName, info] of Object.entries(status)) {
    if (!info.exists) {
      migrationsToApply.push(info.migrationFile);
    }
  }

  if (migrationsToApply.length === 0) {
    console.log('✅ All required tables already exist!');
    console.log('\n🎉 No migrations needed. Metrics implementation is ready!');
    return;
  }

  console.log(`\n📋 Migrations to apply: ${migrationsToApply.length}`);
  for (const migration of migrationsToApply) {
    console.log(`   - ${migration}`);
  }

  // Try to apply via Supabase Management API or provide instructions
  console.log('\n💡 Migration Instructions:');
  console.log('   1. Open Supabase Dashboard SQL Editor');
  console.log('   2. Copy and paste the SQL from each migration file');
  console.log('   3. Run each migration');
  console.log('\n   Or use Supabase CLI:');
  console.log('   supabase db push');

  // Try direct SQL execution if possible
  for (const migrationFile of migrationsToApply) {
    await applyMigration(migrationFile);
  }

  console.log('\n✅ Migration check complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Apply migrations via Supabase Dashboard or CLI');
  console.log('   2. Run: npx tsx scripts/check-metrics-implementation.ts');
  console.log('   3. Test API: GET /api/guide/metrics/unified?include=sustainability,operations,safety');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});

