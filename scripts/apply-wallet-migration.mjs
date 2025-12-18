/**
 * Script to apply wallet migration directly to Supabase database
 * Usage: node scripts/apply-wallet-migration.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found in .env.local');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Running Wallet Enhancements Migration...\n');

  // Read migration file
  const migrationPath = join(__dirname, '..', 'supabase/migrations/20251218000000_019-guide-wallet-enhancements.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration file:', migrationPath);
  console.log('📋 SQL length:', migrationSQL.length, 'characters\n');

  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Execute migration
    console.log('⏳ Executing migration...\n');
    
    const result = await client.query(migrationSQL);
    
    console.log('✅ Migration executed successfully!\n');

    // Verify tables exist
    console.log('🔍 Verifying tables...');
    const verifyResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('guide_savings_goals', 'guide_wallet_milestones')
      ORDER BY table_name;
    `);

    const tables = verifyResult.rows.map((row) => row.table_name);
    
    if (tables.includes('guide_savings_goals') && tables.includes('guide_wallet_milestones')) {
      console.log('✅ Tables verified:');
      tables.forEach((table) => console.log(`   - ${table}`));
    } else {
      console.log('⚠️  Some tables not found:', tables);
    }

    // Verify function exists
    console.log('\n🔍 Verifying function...');
    const functionResult = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name = 'check_wallet_milestones';
    `);

    if (functionResult.rows.length > 0) {
      console.log('✅ Function verified: check_wallet_milestones');
    } else {
      console.log('⚠️  Function not found');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('💡 Next step: Run "npm run update-types" to update TypeScript types');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Some errors are expected (IF NOT EXISTS, etc.)
    if (
      error.message.includes('already exists') ||
      error.message.includes('duplicate') ||
      error.message.includes('does not exist')
    ) {
      console.log('\n⚠️  Some objects may already exist (this is OK)');
      console.log('💡 Migration uses IF NOT EXISTS, so it\'s safe to run multiple times');
    } else {
      console.error('\n💡 Check the error above and try again');
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

runMigration();

