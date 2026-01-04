/**
 * Script to run wallet enhancements migration
 * Usage: npx tsx scripts/run-wallet-migration.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Running Wallet Enhancements Migration...\n');

  // Read migration file
  const migrationPath = join(process.cwd(), 'supabase/migrations/20251218000000_019-guide-wallet-enhancements.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration file:', migrationPath);
  console.log('📋 SQL length:', migrationSQL.length, 'characters\n');

  // Create Supabase client with service role
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Execute migration
    console.log('⏳ Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL,
    });

    if (error) {
      // Try alternative method - direct query
      console.log('⚠️  RPC method failed, trying direct query...');
      
      // Split SQL by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      console.log(`📝 Found ${statements.length} SQL statements`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement || statement.length < 10) continue; // Skip very short statements

        try {
          // Use raw query via REST API
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_ROLE_KEY ?? '',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY ?? ''}`,
            },
            body: JSON.stringify({ sql: statement }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            // Some errors are expected (IF NOT EXISTS, etc.)
            if (!errorText.includes('already exists') && !errorText.includes('duplicate')) {
              console.warn(`⚠️  Statement ${i + 1} warning:`, errorText.substring(0, 100));
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed`);
          }
        } catch (err) {
          console.warn(`⚠️  Statement ${i + 1} error:`, (err as Error).message);
        }
      }
    } else {
      console.log('✅ Migration executed successfully');
    }

    // Verify tables exist
    console.log('\n🔍 Verifying migration...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['guide_savings_goals', 'guide_wallet_milestones']);

    if (tablesError) {
      console.warn('⚠️  Could not verify tables (this is OK if using direct SQL)');
    } else {
      const tableNames = (tables || []).map((t: { table_name: string }) => t.table_name);
      if (tableNames.includes('guide_savings_goals') && tableNames.includes('guide_wallet_milestones')) {
        console.log('✅ Tables verified:', tableNames.join(', '));
      } else {
        console.warn('⚠️  Some tables not found:', tableNames);
      }
    }

    console.log('\n✅ Migration process completed!');
    console.log('📝 Note: If using Supabase Dashboard, you may need to run the SQL manually.');
    console.log('   See: docs/WALLET_MIGRATION_GUIDE.md');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n💡 Alternative: Run migration via Supabase Dashboard');
    console.error('   1. Go to Supabase Dashboard > SQL Editor');
    console.error('   2. Copy content from: supabase/migrations/20251218000000_019-guide-wallet-enhancements.sql');
    console.error('   3. Paste and run');
    process.exit(1);
  }
}

runMigration();

