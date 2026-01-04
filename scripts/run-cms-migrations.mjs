#!/usr/bin/env node

/**
 * Run CMS Migrations
 * Executes all CMS-related migration SQL files in order
 */

import postgres from 'postgres';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars from .env.local
const envPath = join(__dirname, '..', '.env.local');
if (!existsSync(envPath)) {
  console.error('❌ .env.local not found');
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remove quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const databaseUrl =
  env.DATABASE_URL || env.POSTGRES_URL || env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error('❌ No DATABASE_URL found in .env.local');
  console.error(
    'Available keys:',
    Object.keys(env).filter(
      (k) =>
        k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('SUPABASE')
    )
  );
  process.exit(1);
}

console.log('🔌 Connecting to database...\n');

const sql = postgres(databaseUrl, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Migration files in order
const migrations = [
  {
    file: '20260104000001_legal-pages.sql',
    name: 'Legal Pages Table',
    description: 'Create legal_pages table with RLS policies',
  },
  {
    file: '20260104000002_faqs.sql',
    name: 'FAQs Table',
    description: 'Create faqs table with indexes and RLS policies',
  },
  {
    file: '20260104000003_loyalty-rewards.sql',
    name: 'Loyalty Rewards Table',
    description: 'Create loyalty_rewards table with RLS policies',
  },
  {
    file: '20260104000004_about-content.sql',
    name: 'About Content Tables',
    description: 'Create about_stats, about_values, about_awards tables',
  },
  {
    file: '20260104000005_cms-settings.sql',
    name: 'CMS Settings',
    description: 'Insert CMS-related settings (legal, about, app, help, landing)',
  },
  {
    file: '20260104000006_seed-legal-pages.sql',
    name: 'Seed Legal Pages',
    description: 'Migrate existing hardcoded legal page content to database',
  },
  {
    file: '20260104000007_seed-faqs.sql',
    name: 'Seed FAQs',
    description: 'Migrate existing hardcoded FAQs to database',
  },
  {
    file: '20260104000008_seed-rewards.sql',
    name: 'Seed Rewards',
    description: 'Migrate existing hardcoded rewards catalog to database',
  },
  {
    file: '20260104000009_seed-about-content.sql',
    name: 'Seed About Content',
    description: 'Migrate existing about page content to database',
  },
  {
    file: '20260104000010_seed-landing-pages.sql',
    name: 'Seed Landing Pages',
    description: 'Update settings with landing page JSON content',
  },
];

async function runMigration(migration) {
  const migrationPath = join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    migration.file
  );

  if (!existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    return false;
  }

  try {
    console.log(`📦 Running: ${migration.name}`);
    console.log(`   ${migration.description}`);
    console.log(`   File: ${migration.file}\n`);

    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Execute the entire SQL file
    await sql.unsafe(migrationSQL);

    console.log(`✅ ${migration.name} completed successfully!\n`);
    return true;
  } catch (error) {
    // Check if error is due to already existing objects (idempotent)
    const errorMessage = error.message || error.toString();
    if (
      errorMessage.includes('already exists') ||
      errorMessage.includes('duplicate key') ||
      errorMessage.includes('ON CONFLICT')
    ) {
      console.log(`⚠️  ${migration.name} - Some objects already exist (skipping)\n`);
      return true;
    }

    console.error(`❌ ${migration.name} failed:`);
    console.error(errorMessage);
    console.error('');
    return false;
  }
}

async function verifyMigrations() {
  console.log('🔍 Verifying migrations...\n');

  try {
    // Check tables
    const tables = [
      'legal_pages',
      'faqs',
      'loyalty_rewards',
      'about_stats',
      'about_values',
      'about_awards',
    ];

    for (const table of tables) {
      const result = await sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${table}
      `;
      if (result[0]?.count > 0) {
        const count = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
        console.log(`  ✓ Table ${table} exists (${count[0]?.count || 0} rows)`);
      } else {
        console.log(`  ✗ Table ${table} not found`);
      }
    }

    // Check settings
    const settingsResult = await sql`
      SELECT COUNT(*) as count 
      FROM settings 
      WHERE key LIKE 'legal.%' 
         OR key LIKE 'about.%'
         OR key LIKE 'app.%'
         OR key LIKE 'help.%'
         OR key LIKE 'landing.%'
    `;
    console.log(
      `  ✓ CMS settings: ${settingsResult[0]?.count || 0} entries\n`
    );
  } catch (error) {
    console.error('  ❌ Verification error:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting CMS Migrations...\n');
  console.log(`📋 Total migrations: ${migrations.length}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('📊 Migration Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}\n`);

  if (failCount === 0) {
    await verifyMigrations();
    console.log('✅ All CMS migrations completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify settings in Admin Console: /console/settings');
    console.log('   2. Check that all CMS content is accessible');
    console.log('   3. Test public pages (legal, about, help, landing pages)');
  } else {
    console.log('⚠️  Some migrations failed. Please review the errors above.');
  }

  await sql.end();
}

// Run migrations
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

