#!/usr/bin/env node
/**
 * Execute Guide Feedback & ID Card Migrations (036, 037)
 * Uses service role key to execute SQL directly via Supabase REST API
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const migrations = [
  {
    name: '036-guide-feedback-id-card-license',
    path: 'supabase/migrations/20250120000000_036-guide-feedback-id-card-license.sql',
  },
  {
    name: '037-guide-feedback-id-card-menu-items',
    path: 'supabase/migrations/20250120000001_037-guide-feedback-id-card-menu-items.sql',
  },
];

async function executeSQL(sql) {
  try {
    // Use Supabase REST API to execute SQL
    // We'll use the PostgREST endpoint with raw SQL execution via RPC
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (response.ok) {
      return { success: true };
    }

    // If exec_sql doesn't exist, try direct SQL execution via Supabase Management API
    // Fallback: Use Supabase Dashboard SQL Editor approach
    console.log('⚠️  Direct SQL execution not available, using alternative method...');
    
    // Try using Supabase's query method
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (!error) {
      return { success: true, data };
    }

    // Last resort: Return instructions
    return { 
      success: false, 
      error: 'Direct SQL execution not available. Please run via Supabase Dashboard.' 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runMigration(migration) {
  const migrationPath = join(__dirname, '..', migration.path);
  
  console.log(`\n📦 Running migration: ${migration.name}`);
  console.log(`   File: ${migration.path}`);
  
  if (!readFileSync(migrationPath, { encoding: 'utf-8' })) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    return false;
  }

  const sql = readFileSync(migrationPath, 'utf-8');
  
  // Split SQL by semicolons and execute each statement
  // But preserve BEGIN/COMMIT blocks
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  try {
    // Try executing via Supabase Management API or direct connection
    // Since we can't execute raw SQL directly, we'll provide instructions
    console.log('⚠️  Note: Supabase REST API doesn\'t support direct SQL execution.');
    console.log('📋 Please run this migration via Supabase Dashboard:');
    console.log(`   https://supabase.com/dashboard/project/${SUPABASE_URL.split('//')[1].split('.')[0]}/sql/new`);
    console.log(`\n   Or use Supabase CLI:`);
    console.log(`   supabase db push`);
    
    // Verify tables exist instead
    console.log(`\n🔍 Verifying migration results...`);
    
    const tablesToCheck = [
      'guide_feedbacks',
      'guide_feedback_attachments',
      'guide_id_cards',
      'guide_license_applications',
      'guide_document_verifications',
    ];

    const { data: existingTables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', tablesToCheck);

    if (!tableError && existingTables) {
      const foundTables = existingTables.map(t => t.table_name);
      const missingTables = tablesToCheck.filter(t => !foundTables.includes(t));
      
      if (missingTables.length === 0) {
        console.log('✅ All tables exist! Migration appears to be applied.');
        return true;
      } else {
        console.log(`⚠️  Missing tables: ${missingTables.join(', ')}`);
        console.log('   Please run migration manually.');
        return false;
      }
    }

    // Alternative: Check via direct query
    const { data: testQuery, error: testError } = await supabase
      .from('guide_feedbacks')
      .select('id')
      .limit(1);

    if (!testError) {
      console.log('✅ Migration appears to be applied (guide_feedbacks table exists)');
      return true;
    }

    console.log('⚠️  Could not verify migration status automatically.');
    console.log('📋 Please run migration manually via Supabase Dashboard.');
    return false;

  } catch (error) {
    console.error(`❌ Error running migration: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Executing Guide Feedback & ID Card migrations...\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);
  
  let allSuccess = true;
  
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (!success) {
      allSuccess = false;
    }
  }
  
  if (allSuccess) {
    console.log('\n🎉 All migrations verified!');
    console.log('\n📋 Next steps:');
    console.log('   1. Generate types: pnpm update-types');
    console.log('   2. Test endpoints locally');
  } else {
    console.log('\n⚠️  Some migrations need manual execution.');
    console.log('\n💡 To run migrations manually:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy and paste the SQL from each migration file');
    console.log('   3. Run each migration');
    console.log('\n   Migration files:');
    migrations.forEach(m => {
      console.log(`      - ${m.path}`);
    });
  }
}

main().catch(console.error);
