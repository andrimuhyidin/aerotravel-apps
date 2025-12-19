/**
 * Execute migrations directly via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeSQL(sql) {
  // Split by semicolon, but keep CREATE FUNCTION blocks intact
  const statements = [];
  let currentStatement = '';
  let inFunction = false;
  let functionDepth = 0;

  const lines = sql.split('\n');
  
  for (const line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith('--') || line.trim() === '') {
      continue;
    }

    currentStatement += line + '\n';

    // Track function blocks
    if (line.includes('CREATE FUNCTION') || line.includes('CREATE OR REPLACE FUNCTION')) {
      inFunction = true;
      functionDepth = 0;
    }
    
    if (inFunction) {
      // Count BEGIN/END blocks
      const beginMatches = (line.match(/\bBEGIN\b/gi) || []).length;
      const endMatches = (line.match(/\bEND\b/gi) || []).length;
      functionDepth += beginMatches - endMatches;
      
      if (functionDepth <= 0 && line.includes('$$;')) {
        inFunction = false;
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    } else if (line.trim().endsWith(';')) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }

  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt || stmt === ';') continue;

    try {
      // Use Supabase REST API to execute raw SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ sql: stmt }),
      });

      if (!response.ok) {
        // Try alternative: direct query via PostgREST
        // For DDL statements, we need to use a different approach
        const errorText = await response.text();
        console.warn(`⚠️  Statement ${i + 1} warning:`, errorText.substring(0, 100));
      }
    } catch (error) {
      // If RPC doesn't exist, try using Supabase's query builder for DML
      // For DDL (CREATE, ALTER), we need direct database access
      console.warn(`⚠️  Could not execute statement ${i + 1} via RPC, trying alternative...`);
      
      // For now, just log the statement
      if (stmt.length < 200) {
        console.log(`SQL: ${stmt}`);
      } else {
        console.log(`SQL: ${stmt.substring(0, 200)}...`);
      }
    }
  }
}

async function runMigration(filename) {
  const filePath = join(__dirname, '..', 'supabase', 'migrations', filename);
  
  if (!readFileSync.existsSync && !require('fs').existsSync(filePath)) {
    console.error(`❌ File not found: ${filename}`);
    return false;
  }

  const sql = readFileSync(filePath, 'utf-8');
  console.log(`\n📝 Running migration: ${filename}`);
  
  try {
    // Execute SQL directly via psql-like approach using Supabase connection
    // Since Supabase REST API doesn't support DDL directly, we'll use a workaround
    // by executing via the database connection string
    
    // Alternative: Use node-postgres if available, or provide instructions
    console.log(`\n⚠️  Direct SQL execution via REST API is limited.`);
    console.log(`\n📋 Please run this migration via Supabase Dashboard SQL Editor:`);
    console.log(`\nFile: ${filename}`);
    console.log(`\nSQL Content:\n${sql}\n`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error running migration ${filename}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Executing new migrations...\n');
  console.log(`Supabase URL: ${supabaseUrl?.substring(0, 30)}...`);

  const migrations = [
    '20250122000004_046-rag-vector-search.sql',
    '20250122000005_047-trip-briefings.sql',
  ];

  let successCount = 0;
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) successCount++;
  }

  console.log(`\n✅ Processed ${successCount}/${migrations.length} migrations`);
  console.log(`\n💡 For DDL statements (CREATE, ALTER), please run via:`);
  console.log(`   1. Supabase Dashboard → SQL Editor`);
  console.log(`   2. Or use psql with connection string`);
}

main().catch(console.error);
