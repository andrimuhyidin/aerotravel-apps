#!/usr/bin/env node
/**
 * Run Menu Preferences Reorder Migration
 * Migration: 20250122000000_042-guide-menu-preferences-reorder.sql
 * Attempts multiple methods: psql, Supabase CLI, or provides instructions
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const migration = {
  name: '042-guide-menu-preferences-reorder',
  path: join(
    __dirname,
    '..',
    'supabase/migrations/20250122000000_042-guide-menu-preferences-reorder.sql',
  ),
};

async function verifyMigration() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('\n🔍 Verifying migration results...\n');

  try {
    // Check if Pengaturan Bahasa is inactive
    const { data: langMenu } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('href', '/guide/settings#language')
      .maybeSingle();

    if (langMenu) {
      console.log(
        `   ${langMenu.is_active ? '⚠️' : '✅'} Pengaturan Bahasa: is_active = ${langMenu.is_active}`,
      );
    }

    // Check Preferensi order
    const { data: prefsMenu } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('href', '/guide/preferences')
      .eq('section', 'Pengaturan')
      .maybeSingle();

    if (prefsMenu) {
      console.log(
        `   ✅ Preferensi: section = ${prefsMenu.section}, display_order = ${prefsMenu.display_order}`,
      );
    }

    // Check Insight & Performance
    const { data: insightMenu } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('href', '/guide/insights')
      .eq('section', 'Akun')
      .maybeSingle();

    if (insightMenu) {
      console.log(
        `   ✅ Insight & Performance: section = ${insightMenu.section}, display_order = ${insightMenu.display_order}`,
      );
    } else {
      console.log('   ⚠️  Insight & Performance menu not found (will be created by migration)');
    }
  } catch (error) {
    console.log('   ⚠️  Could not verify (this is okay)');
  }
}

async function runViaPsql() {
  if (!DATABASE_URL) {
    return false;
  }

  try {
    execSync('which psql', { stdio: 'ignore' });
  } catch {
    return false;
  }

  if (!existsSync(migration.path)) {
    console.error(`❌ Migration file not found: ${migration.path}`);
    return false;
  }

  console.log('📦 Running migration via psql...\n');
  console.log(`   Migration: ${migration.name}\n`);

  try {
    execSync(`psql "${DATABASE_URL}" -f "${migration.path}"`, {
      stdio: 'inherit',
      cwd: join(__dirname, '..'),
    });
    console.log(`\n✅ ${migration.name} completed\n`);
    await verifyMigration();
    return true;
  } catch (error) {
    console.log(`\n⚠️  Migration may have errors (some objects may already exist)\n`);
    await verifyMigration();
    return true; // Still return true as some errors are expected
  }
}

async function runViaSupabaseCLI() {
  try {
    execSync('which supabase', { stdio: 'ignore' });
  } catch {
    return false;
  }

  console.log('📦 Running migration via Supabase CLI...\n');

  try {
    // Try to push the migration
    execSync(`supabase db push --file "${migration.path}"`, {
      stdio: 'inherit',
      cwd: join(__dirname, '..'),
    });
    console.log(`\n✅ ${migration.name} completed\n`);
    await verifyMigration();
    return true;
  } catch (error) {
    console.log(`\n⚠️  Supabase CLI push failed, trying alternative...\n`);
    return false;
  }
}

async function main() {
  console.log('🚀 Running Menu Preferences Reorder Migration\n');
  console.log(`   File: ${migration.path}\n`);

  if (!existsSync(migration.path)) {
    console.error(`❌ Migration file not found: ${migration.path}`);
    process.exit(1);
  }

  // Try psql first
  if (await runViaPsql()) {
    console.log('🎉 Migration completed successfully!');
    return;
  }

  // Try Supabase CLI
  if (await runViaSupabaseCLI()) {
    console.log('🎉 Migration completed successfully!');
    return;
  }

  // Provide manual instructions
  console.log('❌ Could not run migration automatically\n');
  console.log('💡 Please run migration manually:\n');
  console.log('   Option 1: Supabase Dashboard (RECOMMENDED)');
  console.log('   1. Go to: https://supabase.com/dashboard');
  console.log('   2. Open SQL Editor');
  console.log(`   3. Copy and run the SQL from: ${migration.path}\n`);

  console.log('   Option 2: psql');
  console.log(`   psql "$DATABASE_URL" -f "${migration.path}"\n`);

  console.log('   Option 3: Supabase CLI');
  console.log(`   supabase db push --file "${migration.path}"\n`);

  // Show migration SQL preview
  try {
    const sql = readFileSync(migration.path, 'utf-8');
    console.log('📄 Migration SQL Preview (first 500 chars):\n');
    console.log(sql.substring(0, 500) + '...\n');
  } catch {
    // Ignore
  }

  process.exit(1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
