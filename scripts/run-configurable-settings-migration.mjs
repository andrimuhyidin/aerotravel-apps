#!/usr/bin/env node

/**
 * Run Configurable Settings Migration
 * Executes the migration SQL file to add all new settings to database
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

console.log('🔌 Connecting to database...');

const sql = postgres(databaseUrl, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

async function runMigration() {
  console.log('🚀 Starting Configurable Settings Migration...\n');

  try {
    // Read migration file
    const migrationPath = join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20260103000001_configurable-settings.sql'
    );

    console.log(`📄 Reading migration file: ${migrationPath}`);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('⏳ Executing migration SQL...\n');

    // Execute the entire SQL file
    await sql.unsafe(migrationSQL);

    console.log('✅ Migration executed successfully!\n');

    // Verify by counting inserted settings
    const result = await sql`
      SELECT COUNT(*) as count 
      FROM settings 
      WHERE key LIKE 'branding.%' 
         OR key LIKE 'contact.%' 
         OR key LIKE 'social.%'
         OR key LIKE 'seo.%'
         OR key LIKE 'business.%'
         OR key LIKE 'stats.%'
         OR key LIKE 'legal.%'
         OR key LIKE 'email.%'
         OR key LIKE 'app.%'
         OR key LIKE 'loyalty.%'
    `;

    const count = result[0]?.count || 0;
    console.log(`📊 Found ${count} configurable settings in database`);

    await sql.end();

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify settings in Admin Console: /console/settings');
    console.log('   2. Check that all new settings are visible in the tabs');
    console.log('   3. Update settings values as needed');
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    await sql.end();
    process.exit(1);
  }
}

// Run migration
runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

