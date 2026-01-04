import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:%23AeroTVL2025@db.mjzukilsgkdqmcusjdut.supabase.co:5432/postgres';

const migrations = [
  'supabase/migrations/20251219000000_021-guide-ui-config.sql',
  'supabase/migrations/20251219000001_022-guide-sample-data.sql',
  'supabase/migrations/20251219000002_023-guide-comprehensive-sample.sql',
];

async function runMigrations() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    for (const migration of migrations) {
      const filePath = join(__dirname, '..', migration);
      console.log(`📦 Running ${migration}...`);
      
      const sql = readFileSync(filePath, 'utf8');
      await client.query(sql);
      
      console.log(`✅ ${migration} completed\n`);
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('\n💡 Some tables may not exist yet. This is normal for first run.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();

