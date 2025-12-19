import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD || '#AeroTVL2025';

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
  process.exit(1);
}

// Extract project ref from URL
// Format: https://[project-ref].supabase.co
const urlMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!urlMatch) {
  console.error('❌ Invalid SUPABASE_URL format:', SUPABASE_URL);
  process.exit(1);
}

const projectRef = urlMatch[1];
const DATABASE_URL = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`;

const seedFile = 'supabase/seed/multi-role-test-users.sql';

async function runSeed() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log(`📝 Reading seed file: ${seedFile}...`);
    const filePath = join(__dirname, '..', seedFile);
    const sql = readFileSync(filePath, 'utf8');
    
    console.log('🌱 Running multi-role test users seed...\n');
    await client.query(sql);
    
    console.log('✅ Multi-role test users seeded successfully!\n');
    
    // Verify seed
    console.log('🔍 Verifying seed...');
    const result = await client.query(`
      SELECT 
        u.email,
        COUNT(ur.role) as role_count,
        STRING_AGG(ur.role::text, ', ' ORDER BY ur.is_primary DESC, ur.created_at) as roles
      FROM auth.users u
      JOIN users usr ON u.id = usr.id
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.status = 'active'
        AND u.email LIKE '%@test.com'
      GROUP BY u.email
      HAVING COUNT(ur.role) > 1
      ORDER BY u.email;
    `);
    
    if (result.rows.length > 0) {
      console.log('\n📋 Multi-role test users created:');
      result.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.email} (${row.role_count} roles: ${row.roles})`);
      });
    } else {
      console.log('⚠️  No multi-role users found. Seed may have failed or users already exist.');
    }
    
    console.log('\n🔑 Password for all users: Test@1234');
    console.log('\n🧪 You can now test the RoleSwitcher component with these users!');
    
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('\n💡 Some tables may not exist yet. Please run migrations first.');
    } else if (error.message.includes('password authentication')) {
      console.log('\n💡 Database password incorrect. Please check SUPABASE_DB_PASSWORD in .env.local');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Cannot connect to database. Please check:');
      console.log('   1. NEXT_PUBLIC_SUPABASE_URL is correct');
      console.log('   2. Database is accessible');
      console.log('   3. Network connection is stable');
    }
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
