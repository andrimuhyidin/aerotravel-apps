/**
 * Verify Partner Portal Migrations
 * Check if all tables and columns exist
 */

import pg from 'pg';
import { config } from 'dotenv';

const { Client } = pg;

// Load environment variables
config({ path: '.env.local' });

// Try multiple ways to get database connection
let DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!DATABASE_URL) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD;

  if (!SUPABASE_URL || !DB_PASSWORD) {
    console.error('❌ Database connection not found');
    process.exit(1);
  }

  const urlMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!urlMatch) {
    console.error('❌ Invalid SUPABASE_URL format');
    process.exit(1);
  }

  const projectRef = urlMatch[1];
  DATABASE_URL = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`;
}

const tablesToCheck = [
  'partner_customers',
  'partner_users',
  'partner_support_tickets',
  'booking_reschedule_requests',
];

const columnsToCheck = {
  bookings: ['customer_id'],
};

async function verifyMigrations() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');

    // Check tables
    console.log('📋 Checking tables...\n');
    for (const table of tablesToCheck) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);

      if (result.rows[0].exists) {
        console.log(`  ✅ ${table} table exists`);
      } else {
        console.log(`  ❌ ${table} table NOT found`);
      }
    }

    // Check columns
    console.log('\n📋 Checking columns...\n');
    for (const [table, columns] of Object.entries(columnsToCheck)) {
      for (const column of columns) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1 
            AND column_name = $2
          );
        `, [table, column]);

        if (result.rows[0].exists) {
          console.log(`  ✅ ${table}.${column} column exists`);
        } else {
          console.log(`  ❌ ${table}.${column} column NOT found`);
        }
      }
    }

    // Check RLS policies
    console.log('\n📋 Checking RLS policies...\n');
    const rlsResult = await client.query(`
      SELECT tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename IN ($1, $2, $3, $4)
      ORDER BY tablename, policyname;
    `, tablesToCheck);

    const policiesByTable = {};
    for (const row of rlsResult.rows) {
      if (!policiesByTable[row.tablename]) {
        policiesByTable[row.tablename] = [];
      }
      policiesByTable[row.tablename].push(row.policyname);
    }

    for (const table of tablesToCheck) {
      const policies = policiesByTable[table] || [];
      if (policies.length > 0) {
        console.log(`  ✅ ${table}: ${policies.length} policies`);
        policies.forEach(p => console.log(`     - ${p}`));
      } else {
        console.log(`  ⚠️  ${table}: No policies found`);
      }
    }

    // Check indexes
    console.log('\n📋 Checking indexes...\n');
    const indexResult = await client.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ($1, $2, $3, $4)
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `, tablesToCheck);

    const indexesByTable = {};
    for (const row of indexResult.rows) {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    }

    for (const table of tablesToCheck) {
      const indexes = indexesByTable[table] || [];
      if (indexes.length > 0) {
        console.log(`  ✅ ${table}: ${indexes.length} indexes`);
        indexes.forEach(idx => console.log(`     - ${idx}`));
      } else {
        console.log(`  ⚠️  ${table}: No indexes found`);
      }
    }

    console.log('\n🎉 Verification completed!');
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyMigrations();

