import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD || '#AeroTVL2025';

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
  process.exit(1);
}

// Extract project ref from URL
const urlMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!urlMatch) {
  console.error('❌ Invalid SUPABASE_URL format:', SUPABASE_URL);
  process.exit(1);
}

const projectRef = urlMatch[1];
const DATABASE_URL = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`;

// Migration files in order
const migrations = [
  'supabase/migrations/20250128000000_032-comprehensive-guide-sample-data.sql',
  'supabase/migrations/20250128000001_033-guide-sample-data-part4-onboarding-training.sql',
  'supabase/migrations/20250128000002_034-guide-sample-data-part5-contracts.sql',
  'supabase/migrations/20250128000003_035-guide-sample-data-part6-trips-bookings.sql',
  'supabase/migrations/20250128000004_036-guide-sample-data-part7-trip-execution.sql',
  'supabase/migrations/20250128000005_037-guide-sample-data-part8-posttrip.sql',
  'supabase/migrations/20250128000006_038-guide-sample-data-part9-additional-features.sql',
  'supabase/migrations/20250128000007_039-fix-challenge-duplicates-status.sql',
];

async function runMigrations() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔌 Connecting to database...');
    console.log(`📍 Project: ${projectRef}\n`);
    await client.connect();
    console.log('✅ Connected to database\n');

    let successCount = 0;
    let errorCount = 0;

    for (const migration of migrations) {
      const filePath = join(__dirname, '..', migration);
      const migrationName = migration.split('/').pop();
      
      // Create a new connection for each migration to avoid transaction issues
      const migrationClient = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      
      try {
        await migrationClient.connect();
        console.log(`📦 Running ${migrationName}...`);
        
        const sql = readFileSync(filePath, 'utf8');
        // Each migration file has its own BEGIN/COMMIT
        await migrationClient.query(sql);
        
        console.log(`✅ ${migrationName} completed\n`);
        successCount++;
      } catch (error) {
        console.error(`❌ ${migrationName} failed:`);
        console.error(`   ${error.message}`);
        if (error.position) {
          console.error(`   Position: ${error.position}`);
        }
        if (error.detail) {
          console.error(`   Detail: ${error.detail}`);
        }
        console.error('');
        errorCount++;
        
        // Continue with next migration even if one fails (some tables might not exist yet)
        if (error.message.includes('does not exist') || error.message.includes('column') || error.message.includes('does not exist')) {
          console.log('   ⚠️  Schema mismatch detected. Some columns/tables may not exist. Continuing...\n');
        }
      } finally {
        await migrationClient.end();
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}/${migrations.length}`);
    console.log(`   ❌ Failed: ${errorCount}/${migrations.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verify sample data
    if (successCount > 0) {
      console.log('🔍 Verifying sample data...\n');
      
      try {
        // Check guide users
        const guidesResult = await client.query(`
          SELECT COUNT(*) as count
          FROM users
          WHERE role = 'guide';
        `);
        console.log(`👥 Guide users: ${guidesResult.rows[0]?.count || 0}`);
        
        // Check trips
        const tripsResult = await client.query(`
          SELECT status, COUNT(*) as count
          FROM trips
          GROUP BY status;
        `);
        console.log(`🚢 Trips by status:`);
        tripsResult.rows.forEach(row => {
          console.log(`   ${row.status}: ${row.count}`);
        });
        
        // Check bookings
        const bookingsResult = await client.query(`
          SELECT COUNT(*) as count
          FROM bookings;
        `);
        console.log(`📋 Bookings: ${bookingsResult.rows[0]?.count || 0}`);
        
        // Check reviews
        const reviewsResult = await client.query(`
          SELECT COUNT(*) as count
          FROM reviews;
        `);
        console.log(`⭐ Reviews: ${reviewsResult.rows[0]?.count || 0}`);
        
        // Check wallet transactions
        const walletTxResult = await client.query(`
          SELECT COUNT(*) as count
          FROM guide_wallet_transactions;
        `);
        console.log(`💳 Wallet transactions: ${walletTxResult.rows[0]?.count || 0}`);
        
        console.log('\n🎉 Sample data verification completed!');
      } catch (verifyError) {
        console.log('⚠️  Verification skipped (some tables may not exist)');
      }
    }

    if (errorCount > 0) {
      console.log('\n⚠️  Some migrations failed. Please check the errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ All migrations completed successfully!');
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();

