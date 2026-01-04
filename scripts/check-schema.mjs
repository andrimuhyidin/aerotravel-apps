import { config } from 'dotenv';
import { dirname } from 'path';
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

const urlMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!urlMatch) {
  console.error('❌ Invalid SUPABASE_URL format:', SUPABASE_URL);
  process.exit(1);
}

const projectRef = urlMatch[1];
const DATABASE_URL = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`;

const tablesToCheck = [
  'guide_bank_accounts',
  'guide_contract_sanctions',
  'trip_guides',
  'booking_passengers',
  'guide_wallet_transactions',
  'guide_status',
  'guide_availability',
];

async function checkSchema() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('🔌 Connected to database\n');

    for (const tableName of tablesToCheck) {
      console.log(`📋 Checking table: ${tableName}`);
      
      try {
        const result = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
          ORDER BY ordinal_position;
        `, [tableName]);

        if (result.rows.length === 0) {
          console.log(`   ⚠️  Table does not exist\n`);
        } else {
          console.log(`   Columns (${result.rows.length}):`);
          result.rows.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            console.log(`     - ${col.column_name} (${col.data_type}) ${nullable}${defaultVal}`);
          });
          
          // Check for enums
          const enumResult = await client.query(`
            SELECT t.typname, e.enumlabel
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname IN (
              SELECT udt_name
              FROM information_schema.columns
              WHERE table_name = $1
                AND udt_name LIKE '%enum%'
            )
            ORDER BY t.typname, e.enumsortorder;
          `, [tableName]);
          
          if (enumResult.rows.length > 0) {
            console.log(`   Enum values:`);
            const enumGroups = {};
            enumResult.rows.forEach(row => {
              if (!enumGroups[row.typname]) {
                enumGroups[row.typname] = [];
              }
              enumGroups[row.typname].push(row.enumlabel);
            });
            Object.entries(enumGroups).forEach(([type, values]) => {
              console.log(`     ${type}: [${values.join(', ')}]`);
            });
          }
          
          console.log('');
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    // Check wallet transaction type enum specifically
    console.log('📋 Checking enum: guide_wallet_transaction_type');
    try {
      const enumResult = await client.query(`
        SELECT e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'guide_wallet_transaction_type'
        ORDER BY e.enumsortorder;
      `);
      
      if (enumResult.rows.length > 0) {
        const values = enumResult.rows.map(r => r.enumlabel);
        console.log(`   Values: [${values.join(', ')}]\n`);
      } else {
        console.log(`   ⚠️  Enum does not exist\n`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Check trip_status enum
    console.log('📋 Checking enum: trip_status');
    try {
      const enumResult = await client.query(`
        SELECT e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'trip_status'
        ORDER BY e.enumsortorder;
      `);
      
      if (enumResult.rows.length > 0) {
        const values = enumResult.rows.map(r => r.enumlabel);
        console.log(`   Values: [${values.join(', ')}]\n`);
      } else {
        console.log(`   ⚠️  Enum does not exist\n`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkSchema();

