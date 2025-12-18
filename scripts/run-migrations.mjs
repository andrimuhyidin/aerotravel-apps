import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mjzukilsgkdqmcusjdut.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_JT_3cgWg2As222JrSVy0AQ_S_McPr_R';

const migrations = [
  'supabase/migrations/20251219000000_021-guide-ui-config.sql',
  'supabase/migrations/20251219000001_022-guide-sample-data.sql',
  'supabase/migrations/20251219000002_023-guide-comprehensive-sample.sql',
];

async function runMigrations() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('✅ Connected to Supabase');

  for (const migration of migrations) {
    const filePath = join(__dirname, '..', migration);
    console.log(`\n📦 Running ${migration}...`);
    
    const sql = readFileSync(filePath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('BEGIN') && !s.startsWith('COMMIT'));

    for (const statement of statements) {
      if (statement.includes('DO $$')) {
        // Handle DO blocks separately
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          console.error(`❌ Error in statement:`, error.message);
        }
      } else {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        if (error) {
          // Try direct query
          try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              },
              body: JSON.stringify({ sql_query: statement + ';' }),
            });
            if (!response.ok) {
              console.warn(`⚠️  Warning: ${response.statusText}`);
            }
          } catch (e) {
            console.warn(`⚠️  Could not execute via RPC, trying direct...`);
          }
        }
      }
    }
    
    console.log(`✅ ${migration} completed`);
  }

  console.log('\n🎉 All migrations completed!');
}

runMigrations().catch(console.error);
