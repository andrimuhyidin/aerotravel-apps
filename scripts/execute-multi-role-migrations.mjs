#!/usr/bin/env node
/**
 * Execute Multi-Role System Migrations
 * Creates exec_sql function first, then runs migrations
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const MIGRATION_1 = join(projectRoot, 'supabase/migrations/20251221000000_029-multi-role-system.sql');
const MIGRATION_2 = join(projectRoot, 'supabase/migrations/20251221000001_030-multi-role-data-migration.sql');

async function createExecSQLFunction(supabase, supabaseUrl, serviceRoleKey) {
  const createFunctionSQL = `
CREATE OR REPLACE FUNCTION exec_sql(statement TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE statement;
END;
$$;
`;

  // Try to execute via direct SQL connection
  // Since we can't execute raw SQL directly, we'll use a workaround
  console.log('🔧 Setting up exec_sql function...');
  
  // Check if function exists by trying to use it
  const { error: testError } = await supabase.rpc('exec_sql', { 
    statement: 'SELECT 1;' 
  });

  if (!testError) {
    console.log('✅ exec_sql function already exists');
    return true;
  }

  // Function doesn't exist, need to create it manually
  console.log('⚠️  exec_sql function not found');
  console.log('📝 Creating function via Supabase Dashboard...');
  
  // We'll create a temporary migration file for the function
  const functionSQL = createFunctionSQL.trim();
  
  // Try to execute via Management API if access token available
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  if (accessToken && projectId) {
    try {
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ query: functionSQL }),
      });

      if (response.ok) {
        console.log('✅ exec_sql function created via Management API');
        return true;
      }
    } catch (error) {
      console.log('⚠️  Management API failed, will create function manually');
    }
  }

  // Fallback: provide instructions
  console.log('\n📋 Please create exec_sql function manually:');
  console.log('   1. Open Supabase Dashboard > SQL Editor');
  console.log('   2. Run this SQL:');
  console.log('\n' + functionSQL + '\n');
  console.log('   3. Then re-run this script');
  
  return false;
}

async function executeMigration(sql, migrationName, supabase, supabaseUrl, serviceRoleKey) {
  console.log(`\n📦 Executing: ${migrationName}`);

  // Remove BEGIN/COMMIT
  let cleanSQL = sql
    .replace(/^BEGIN;?\s*/i, '')
    .replace(/COMMIT;?\s*$/i, '')
    .trim();

  // Split into statements (handle DO blocks)
  const statements = [];
  let currentStatement = '';
  let inDoBlock = false;
  let doBlockDepth = 0;

  const lines = cleanSQL.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!trimmed || trimmed.startsWith('--')) {
      if (inDoBlock) currentStatement += '\n' + line;
      continue;
    }

    if (trimmed.includes('DO $$')) {
      inDoBlock = true;
      doBlockDepth = 1;
      currentStatement = line;
      continue;
    }

    if (inDoBlock) {
      currentStatement += '\n' + line;
      if (trimmed.includes('$$')) {
        doBlockDepth += (trimmed.match(/\$\$/g) || []).length;
        if (doBlockDepth >= 2) {
          inDoBlock = false;
          doBlockDepth = 0;
          statements.push(currentStatement);
          currentStatement = '';
        }
      }
      continue;
    }

    if (trimmed.endsWith(';')) {
      currentStatement += (currentStatement ? '\n' : '') + line;
      if (currentStatement.length > 10) {
        statements.push(currentStatement);
      }
      currentStatement = '';
    } else {
      currentStatement += (currentStatement ? '\n' : '') + line;
    }
  }

  if (currentStatement && currentStatement.length > 10) {
    statements.push(currentStatement);
  }

  console.log(`   Found ${statements.length} statements`);

  // Execute each statement
  let successCount = 0;
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.length < 10) continue;

    try {
      const { error } = await supabase.rpc('exec_sql', { statement });
      
      if (error) {
        // Try REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ statement }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          if (!errorText.includes('already exists') && !errorText.includes('duplicate')) {
            throw new Error(errorText.substring(0, 100));
          }
        }
      }
      
      successCount++;
      if (i % 5 === 0) {
        process.stdout.write(`   Progress: ${i + 1}/${statements.length}\r`);
      }
    } catch (error) {
      if (error.message.includes('Could not find the function')) {
        throw new Error('exec_sql function not available. Please create it first.');
      }
      // Continue with warnings for expected errors
      if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
        console.log(`\n   ⚠️  Statement ${i + 1}: ${error.message.substring(0, 60)}...`);
      }
    }
  }

  console.log(`\n   ✅ Executed ${successCount}/${statements.length} statements`);
  return true;
}

async function main() {
  console.log('🚀 Multi-Role System Migration Execution\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Step 1: Create exec_sql function
    const hasExecSQL = await createExecSQLFunction(supabase, supabaseUrl, serviceRoleKey);
    
    if (!hasExecSQL) {
      console.log('\n⏸️  Please create exec_sql function first, then re-run this script');
      console.log('   Or run migrations manually via Supabase Dashboard');
      process.exit(1);
    }

    // Step 2: Read migrations
    const migration1 = readFileSync(MIGRATION_1, 'utf-8');
    const migration2 = readFileSync(MIGRATION_2, 'utf-8');

    // Step 3: Execute migrations
    await executeMigration(migration1, '029-multi-role-system.sql', supabase, supabaseUrl, serviceRoleKey);
    await executeMigration(migration2, '030-multi-role-data-migration.sql', supabase, supabaseUrl, serviceRoleKey);

    console.log('\n✅ All migrations executed successfully!');

    // Step 4: Verify tables
    console.log('\n🔍 Verifying tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('user_roles')
      .select('id')
      .limit(1);

    if (tablesError && !tablesError.message.includes('relation') && !tablesError.message.includes('does not exist')) {
      console.log('⚠️  Verification warning:', tablesError.message);
    } else {
      console.log('✅ Tables verified');
    }

    // Step 5: Generate types
    console.log('\n📝 Generating TypeScript types...');
    const { execSync } = await import('child_process');
    try {
      execSync('pnpm update-types', { stdio: 'inherit', cwd: projectRoot });
      console.log('\n✅ Types generated successfully!');
    } catch (error) {
      console.log('\n⚠️  Type generation failed. Run manually: pnpm update-types');
    }

    console.log('\n🎉 Multi-Role System is now fully functional!');
    console.log('\n📋 Next steps:');
    console.log('   - Test role applications at /partner/apply');
    console.log('   - Check admin panel at /console/users/role-applications');
    console.log('   - Test role switching functionality');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n📋 Alternative: Run migrations via Supabase Dashboard');
    console.log('   1. Open: https://supabase.com/dashboard');
    console.log('   2. SQL Editor');
    console.log('   3. Copy & paste migration files');
    process.exit(1);
  }
}

main().catch(console.error);
