/**
 * Migration Executor
 * Run this with: npx tsx lib/scripts/execute-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const migrations = [
  'supabase/migrations/20250225000013_121-package-reviews-system.sql',
  'supabase/migrations/20250225000014_122-analytics-ab-testing-feedback.sql',
];

async function executeMigration(filePath: string) {
  console.log(`\n📄 Executing: ${filePath}`);
  
  try {
    const sql = readFileSync(resolve(process.cwd(), filePath), 'utf8');
    
    // Split by statement if needed
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`   Found ${statements.length} SQL statements`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length < 10) continue; // Skip empty
      
      try {
        // Execute via RPC or direct query
        const { error } = await supabase.rpc('exec_sql', { 
          query: statement + ';' 
        });
        
        if (error) {
          console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
          return false;
        }
      } catch (err) {
        console.error(`   ❌ Statement ${i + 1} error:`, err);
      }
    }

    console.log(`   ✅ Migration successful`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to read or execute:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Migration Executor Starting...\n');
  console.log('📦 Project:', SUPABASE_URL);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let success = 0;
  let failed = 0;

  for (const migration of migrations) {
    const result = await executeMigration(migration);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Failed:  ${failed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed > 0) {
    console.log('⚠️  Some migrations failed.');
    console.log('💡 Please run them manually via Supabase Dashboard SQL Editor\n');
    process.exit(1);
  }

  console.log('🎉 All migrations completed!\n');
}

main();

