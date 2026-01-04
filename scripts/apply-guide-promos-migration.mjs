import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const migrationFilePath = join(__dirname, '..', 'supabase', 'migrations', '20250124000004_062-guide-promos-table.sql');

const DATABASE_URL = process.env.DATABASE_URL;

async function runMigration() {
  console.log('🚀 Applying guide_promos table migration...');

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('📦 Connecting to database...');
    console.log('✅ Connected to database');

    const sql = readFileSync(migrationFilePath, 'utf8');
    console.log('\n📝 Executing migration...');
    await client.query(sql);
    console.log('✅ Migration executed successfully!');

    console.log('\n🔍 Verifying migration...');
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'guide_promos'
      ORDER BY ordinal_position;
    `;
    const { rows: columns } = await client.query(verifyQuery);

    if (columns.length > 0) {
      console.log('✅ guide_promos table created successfully with columns:');
      columns.forEach(col => console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`));
    } else {
      console.error('❌ guide_promos table verification failed. Table might not exist.');
      process.exit(1);
    }

    // Verify indexes
    const verifyIndexesQuery = `
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'guide_promos' 
      AND indexname LIKE 'idx_guide_promos%';
    `;
    const { rows: indexes } = await client.query(verifyIndexesQuery);
    if (indexes.length > 0) {
      console.log('✅ Indexes created successfully:');
      indexes.forEach(idx => console.log(`   - ${idx.indexname}`));
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:\n   1. Run: pnpm update-types\n   2. Test API endpoint: GET /api/guide/promos-updates');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

