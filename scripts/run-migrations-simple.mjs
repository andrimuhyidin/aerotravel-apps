import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL(file) {
  const sql = readFileSync(file, 'utf-8');
  console.log(`\n📝 Executing: ${file.split('/').pop()}`);
  
  // Split and execute statements
  const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
  
  for (const stmt of statements) {
    const clean = stmt.trim();
    if (!clean || clean === ';') continue;
    
    try {
      // Use fetch to execute via Supabase REST API
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ sql: clean }),
      });
      
      if (!res.ok) {
        const text = await res.text();
        console.log(`⚠️  ${text.substring(0, 100)}`);
      } else {
        console.log(`✅ Statement executed`);
      }
    } catch (e) {
      console.log(`⚠️  ${e.message}`);
    }
  }
}

const base = join(dirname(fileURLToPath(import.meta.url)), '..');
await runSQL(join(base, 'supabase/migrations/20250122000004_046-rag-vector-search.sql'));
await runSQL(join(base, 'supabase/migrations/20250122000005_047-trip-briefings.sql'));
console.log('\n✅ Done!');
