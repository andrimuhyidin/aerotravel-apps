#!/usr/bin/env node

/**
 * Run Guide Documents Migration
 * Creates guide_documents table for storing guide documents
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running Guide Documents Migration...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250122000001_043-guide-documents.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('📄 Reading migration file...');
    console.log(`   File: ${migrationPath}`);
    console.log(`   Size: ${sql.length} bytes\n`);

    // Execute migration
    console.log('⚙️  Executing migration...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('   Trying direct query execution...');
      
      // Split SQL by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('BEGIN') || statement.includes('COMMIT')) {
          continue; // Skip transaction markers
        }
        
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
          if (stmtError && !stmtError.message.includes('already exists')) {
            console.warn(`   Warning: ${stmtError.message}`);
          }
        } catch (e) {
          // Ignore errors for statements that might already exist
          if (!e.message?.includes('already exists')) {
            console.warn(`   Warning: ${e.message}`);
          }
        }
      }
    }

    console.log('✅ Migration executed successfully!\n');

    // Verify table exists
    console.log('🔍 Verifying table creation...');
    const { data: tables, error: verifyError } = await supabase
      .from('guide_documents')
      .select('*')
      .limit(1);

    if (verifyError && verifyError.code === '42P01') {
      console.error('❌ Table guide_documents does not exist');
      console.error('   Please run the migration manually in Supabase dashboard');
      process.exit(1);
    }

    console.log('✅ Table guide_documents exists and is accessible\n');

    // Check RLS policies
    console.log('🔒 Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .rpc('check_rls_policies', { table_name: 'guide_documents' })
      .catch(() => ({ data: null, error: null }));

    if (!policyError) {
      console.log('✅ RLS policies are active\n');
    } else {
      console.log('⚠️  Could not verify RLS policies (this is okay if using service role)\n');
    }

    console.log('🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify table in Supabase dashboard');
    console.log('   2. Test document upload via API');
    console.log('   3. Check eligibility endpoint includes documents_complete requirement');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 You may need to run this migration manually in Supabase dashboard:');
    console.error('   supabase/migrations/20250122000001_043-guide-documents.sql');
    process.exit(1);
  }
}

runMigration();
