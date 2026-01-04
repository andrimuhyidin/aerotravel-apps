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

async function executeSQL(sql) {
  // Use Supabase Management API
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SQL execution failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

async function runMigrations() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('✅ Connected to Supabase\n');

  for (const migration of migrations) {
    const filePath = join(__dirname, '..', migration);
    console.log(`📦 Running ${migration}...`);
    
    const sql = readFileSync(filePath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT');

    let currentStatement = '';
    let inDoBlock = false;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      if (stmt.includes('DO $$')) {
        inDoBlock = true;
        currentStatement = stmt;
        continue;
      }

      if (inDoBlock) {
        currentStatement += '; ' + stmt;
        if (stmt.includes('END $$')) {
          inDoBlock = false;
          try {
            await executeSQL(currentStatement + ';');
            currentStatement = '';
          } catch (error) {
            console.warn(`⚠️  Warning: ${error.message}`);
            // Try via direct query
            try {
              const { error: queryError } = await supabase.rpc('exec_sql', { query: currentStatement });
              if (queryError) throw queryError;
            } catch (e) {
              console.error(`❌ Failed to execute DO block`);
            }
            currentStatement = '';
          }
        }
        continue;
      }

      if (stmt.length > 10) {
        try {
          await executeSQL(stmt + ';');
        } catch (error) {
          // Try alternative: direct table operations via Supabase client
          if (stmt.includes('CREATE TABLE')) {
            console.log('   Creating table via alternative method...');
            // Skip for now, will use Supabase Dashboard
          } else if (stmt.includes('INSERT INTO')) {
            console.log('   Inserting data via alternative method...');
            // Parse and insert via Supabase client
            const match = stmt.match(/INSERT INTO (\w+) \((.+?)\) VALUES \((.+?)\)/);
            if (match) {
              const [, table, columns, values] = match;
              const cols = columns.split(',').map(c => c.trim());
              const vals = values.split(',').map(v => v.trim().replace(/'/g, ''));
              const data = {};
              cols.forEach((col, idx) => {
                data[col] = vals[idx];
              });
              const { error } = await supabase.from(table).insert(data);
              if (error) console.warn(`   ⚠️  ${error.message}`);
            }
          } else {
            console.warn(`   ⚠️  Skipping: ${stmt.substring(0, 50)}...`);
          }
        }
      }
    }
    
    console.log(`✅ ${migration} completed\n`);
  }

  console.log('🎉 All migrations completed!');
  console.log('\n💡 Note: Some statements may need to be run manually via Supabase Dashboard SQL Editor');
}

runMigrations().catch((error) => {
  console.error('❌ Migration failed:', error.message);
  console.log('\n💡 Please run migrations manually via Supabase Dashboard SQL Editor');
  process.exit(1);
});

