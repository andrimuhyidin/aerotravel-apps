import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
  for (const migration of migrations) {
    const filePath = join(__dirname, '..', migration);
    console.log(`\n📦 Running ${migration}...`);
    
    const sql = readFileSync(filePath, 'utf8');
    
    // Use Supabase Management API to execute SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error: ${response.status} - ${errorText}`);
      
      // Try alternative: Use pg_net extension if available
      console.log('⚠️  Trying alternative method...');
      const altResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pg_net_http_request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({
          url: `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: sql }),
        }),
      });
      
      if (!altResponse.ok) {
        console.error(`❌ Alternative method also failed`);
        console.log('\n💡 Please run migrations manually via Supabase Dashboard SQL Editor');
        console.log(`   Files: ${migrations.join(', ')}`);
        return;
      }
    }
    
    console.log(`✅ ${migration} completed`);
  }

  console.log('\n🎉 All migrations completed!');
}

runMigrations().catch(console.error);

