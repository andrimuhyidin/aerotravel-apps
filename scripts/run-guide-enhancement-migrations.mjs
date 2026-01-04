/**
 * Execute Guide Enhancement System Migrations
 * Uses Supabase client to execute migrations via SQL
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  console.error('\n💡 Make sure .env.local exists and contains these variables.');
  process.exit(1);
}

console.log('🚀 Starting Guide Enhancement System Migrations...\n');
console.log(`📍 Supabase URL: ${supabaseUrl.substring(0, 30)}...`);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeSQL(sql) {
  // Supabase JS client doesn't support raw SQL execution
  // We need to use the REST API with exec_sql function or use psql
  
  // Try to use Supabase REST API
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function executeMigration(filePath, fileName) {
  console.log(`\n📄 Processing: ${fileName}`);
  
  try {
    const sql = readFileSync(filePath, 'utf-8');
    
    // Try to execute via REST API
    const result = await executeSQL(sql);
    
    if (result.success) {
      console.log(`✅ ${fileName} executed successfully`);
      return true;
    } else {
      console.log(`⚠️  REST API method failed: ${result.error}`);
      console.log(`\n📋 Please execute manually:`);
      console.log(`   File: ${filePath}`);
      console.log(`   Or use Supabase Dashboard SQL Editor`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error reading ${fileName}:`, error.message);
    return false;
  }
}

async function main() {
  const migrations = [
    {
      file: join(__dirname, '..', 'supabase', 'migrations', '20251220000005_033-guide-enhancement-system.sql'),
      name: '033-guide-enhancement-system.sql',
    },
    {
      file: join(__dirname, '..', 'supabase', 'migrations', '20251220000006_034-guide-enhancement-default-data.sql'),
      name: '034-guide-enhancement-default-data.sql',
    },
    {
      file: join(__dirname, '..', 'supabase', 'migrations', '20251220000007_035-guide-enhancement-menu-items.sql'),
      name: '035-guide-enhancement-menu-items.sql',
    },
  ];

  // Check if exec_sql function exists, if not create it
  console.log('🔍 Checking for exec_sql function...');
  
  const createExecSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE query;
    END;
    $$;
  `;

  try {
    await executeSQL(createExecSQL);
    console.log('✅ exec_sql function ready\n');
  } catch (error) {
    console.log('⚠️  Could not create exec_sql function, will try direct execution\n');
  }

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await executeMigration(migration.file, migration.name);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ⚠️  Manual Required: ${failCount}`);
  console.log(`${'='.repeat(60)}\n`);

  if (failCount > 0) {
    console.log('💡 To execute manually:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Copy and paste the SQL from migration files');
    console.log('   3. Execute each migration file\n');
  }

  if (successCount === migrations.length) {
    console.log('✅ All migrations executed successfully!');
    console.log('🔄 Next step: Run "npm run update-types" to regenerate TypeScript types\n');
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
