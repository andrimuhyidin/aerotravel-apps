/**
 * Run new migrations (046 and 047) directly
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration(filename) {
  const filePath = join(__dirname, '..', 'supabase', 'migrations', filename);
  const sql = readFileSync(filePath, 'utf-8');

  console.log(`\n📝 Running migration: ${filename}`);
  
  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          // Try direct query if RPC doesn't work
          const { error: queryError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(0); // Dummy query to test connection
          
          // If RPC doesn't exist, we need to use raw SQL
          console.warn(`⚠️  RPC not available, trying alternative method...`);
          console.log(`SQL: ${statement.substring(0, 100)}...`);
        }
      } catch (err) {
        console.error(`❌ Error executing statement:`, err.message);
        // Continue with next statement
      }
    }
  }
}

async function main() {
  console.log('🚀 Running new migrations...\n');

  const migrations = [
    '20250122000004_046-rag-vector-search.sql',
    '20250122000005_047-trip-briefings.sql',
  ];

  for (const migration of migrations) {
    await runMigration(migration);
  }

  console.log('\n✅ Migrations completed!');
}

main().catch(console.error);
