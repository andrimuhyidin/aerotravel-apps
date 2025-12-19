#!/usr/bin/env node

/**
 * Run Guide UI Migration using pg client
 * Migration: 20251220000001_024-guide-quick-actions-menu-items.sql
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import * as dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌');
  process.exit(1);
}

// Extract database connection details from Supabase URL
// Format: https://[project-ref].supabase.co
// We need to construct: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
const urlMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!urlMatch) {
  console.error('❌ Invalid SUPABASE_URL format');
  process.exit(1);
}

const projectRef = urlMatch[1];
// Try to get password from env or use default pattern
const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD || '#AeroTVL2025';
const DATABASE_URL = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;

const migrationFile = 'supabase/migrations/20251220000001_024-guide-quick-actions-menu-items.sql';

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    const filePath = join(__dirname, '..', migrationFile);
    console.log(`📦 Running migration: ${migrationFile}\n`);
    
    const sql = readFileSync(filePath, 'utf8');
    
    // Execute migration
    await client.query(sql);
    
    console.log('✅ Migration executed successfully!\n');

    // Verify tables were created
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('guide_quick_actions', 'guide_menu_items');
    `;
    
    const { rows } = await client.query(verifyQuery);
    const tableNames = rows.map((r) => r.table_name);

    if (tableNames.includes('guide_quick_actions') && tableNames.includes('guide_menu_items')) {
      console.log('✅ Verification: Tables created successfully');
      console.log('   - guide_quick_actions ✅');
      console.log('   - guide_menu_items ✅\n');

      // Check default data
      const { rows: quickActionsCount } = await client.query('SELECT COUNT(*) as count FROM guide_quick_actions');
      const { rows: menuItemsCount } = await client.query('SELECT COUNT(*) as count FROM guide_menu_items');
      
      console.log(`📊 Default data inserted:`);
      console.log(`   - Quick Actions: ${quickActionsCount[0]?.count || 0} items`);
      console.log(`   - Menu Items: ${menuItemsCount[0]?.count || 0} items\n`);
    } else {
      console.log('⚠️  Warning: Could not verify all tables');
      console.log(`   Found: ${tableNames.join(', ') || 'none'}\n`);
    }

    console.log('🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npm run update-types');
    console.log('   2. Test quick actions and menu items in Guide App\n');
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Migration failed:', err.message);
    if (err.message.includes('does not exist')) {
      console.log('\n💡 Some dependencies may not exist yet. This is normal for first run.');
      console.log('   Try running prerequisite migrations first.\n');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

