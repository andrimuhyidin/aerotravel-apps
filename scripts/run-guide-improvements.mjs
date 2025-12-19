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

const migrations = [
  'supabase/migrations/20251219000002_025-guide-menu-improvements.sql',
  'supabase/migrations/20251219000003_026-guide-color-system.sql',
  'supabase/migrations/20251220000002_028-guide-profile-menu-reorganization.sql',
  'supabase/migrations/20251220000003_029-guide-bank-accounts.sql',
  'supabase/migrations/20251220000004_030-guide-trip-confirmation.sql',
  'supabase/migrations/20251220000005_031-trip-confirmation-cron.sql',
];

async function runMigrations() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    for (const migration of migrations) {
      const filePath = join(__dirname, '..', migration);
      console.log(`📦 Running ${migration}...`);
      
      const sql = readFileSync(filePath, 'utf8');
      await client.query(sql);
      
      console.log(`✅ ${migration} completed\n`);
    }

    // Verify improvements
    console.log('🔍 Verifying improvements...\n');
    
    // Check menu items count
    const menuItemsResult = await client.query(`
      SELECT section, COUNT(*) as count
      FROM guide_menu_items
      WHERE branch_id IS NULL AND is_active = true
      GROUP BY section
      ORDER BY section;
    `);
    
    console.log('📋 Menu Items by Section:');
    menuItemsResult.rows.forEach(row => {
      console.log(`   ${row.section}: ${row.count} items`);
    });
    
    // Check quick actions with new colors
    const quickActionsResult = await client.query(`
      SELECT href, label, color, display_order
      FROM guide_quick_actions
      WHERE branch_id IS NULL AND is_active = true
      ORDER BY display_order;
    `);
    
    console.log('\n🎨 Quick Actions (with improved colors):');
    quickActionsResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.label} (${row.color})`);
    });
    
    // Check bank accounts table
    const bankAccountsResult = await client.query(`
      SELECT COUNT(*) as count
      FROM guide_bank_accounts;
    `);
    
    console.log('\n🏦 Bank Accounts Table:');
    console.log(`   Total accounts: ${bankAccountsResult.rows[0]?.count || 0}`);
    
    console.log('\n🎉 All migrations completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Added missing menu items (Password, Notifications, History, etc.)');
    console.log('   ✅ Updated quick actions priority');
    console.log('   ✅ Improved color system with semantic meaning');
    console.log('   ✅ Reorganized profile menu (removed redundant items, added Learning Hub)');
    console.log('   ✅ Added bank account management with approval system');
    console.log('   ✅ Added trip assignment confirmation system with deadline');
    console.log('\n🧪 You can now test the improved Guide Apps menu!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('\n💡 Some tables may not exist yet. Please run base migrations first.');
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

runMigrations();
