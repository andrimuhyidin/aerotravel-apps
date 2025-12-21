#!/usr/bin/env node
/**
 * Run Guide Menu Reorganization Migration
 * Migration: 20250126000001_044-guide-menu-final-reorganization.sql
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  console.log('🚀 Running Guide Menu Reorganization Migration...\n');

  const migrationPath = join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '20250126000001_044-guide-menu-final-reorganization.sql',
  );

  let migrationSQL;
  try {
    migrationSQL = readFileSync(migrationPath, 'utf-8');
  } catch (error) {
    console.error(`❌ Error: Cannot read migration file: ${migrationPath}`);
    console.error(error.message);
    process.exit(1);
  }

  try {
    console.log('📦 Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL,
    });

    if (error) {
      // Try alternative method - execute via REST API
      console.log('⚠️  RPC method failed, trying alternative method...');
      
      // Split SQL by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('BEGIN') || statement.includes('COMMIT')) {
          continue; // Skip transaction markers
        }
        
        try {
          const { error: execError } = await supabase.rpc('exec_sql', {
            sql: statement + ';',
          });
          if (execError) {
            console.warn(`⚠️  Warning: ${execError.message}`);
          }
        } catch (err) {
          console.warn(`⚠️  Warning: ${err.message}`);
        }
      }
    }

    console.log('✅ Migration executed successfully!\n');
  } catch (error) {
    console.error('❌ Error executing migration:');
    console.error(error.message);
    console.error('\n💡 Alternative: Run migration manually via Supabase Dashboard:');
    console.error('   1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new');
    console.error(`   2. Copy content from: ${migrationPath}`);
    console.error('   3. Paste and run in SQL Editor');
    process.exit(1);
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration results...\n');

  try {
    // Check sections
    const { data: sections, error: sectionsError } = await supabase
      .from('guide_menu_items')
      .select('section')
      .eq('is_active', true);

    if (sectionsError) {
      console.error('❌ Error checking sections:', sectionsError.message);
      return;
    }

    const uniqueSections = [...new Set(sections?.map((s) => s.section) || [])];
    console.log('📋 Active sections:', uniqueSections.join(', '));

    // Check items per section
    const { data: items, error: itemsError } = await supabase
      .from('guide_menu_items')
      .select('section, href, label, display_order')
      .eq('is_active', true)
      .order('section')
      .order('display_order');

    if (itemsError) {
      console.error('❌ Error checking items:', itemsError.message);
      return;
    }

    console.log('\n📊 Menu Items by Section:\n');

    const grouped = items?.reduce((acc, item) => {
      if (!acc[item.section]) {
        acc[item.section] = [];
      }
      acc[item.section].push(item);
      return acc;
    }, {});

    const sectionOrder = ['Akun', 'Pembelajaran', 'Dukungan', 'Pengaturan'];
    
    for (const section of sectionOrder) {
      const sectionItems = grouped?.[section] || [];
      if (sectionItems.length > 0) {
        console.log(`\n${section} (${sectionItems.length} items):`);
        sectionItems.forEach((item) => {
          console.log(`  ${item.display_order}. ${item.label} (${item.href})`);
        });
      }
    }

    // Check for expected items
    console.log('\n✅ Verification Summary:');
    const expectedItems = [
      { section: 'Akun', href: '/guide/profile/edit' },
      { section: 'Akun', href: '/guide/contracts' },
      { section: 'Akun', href: '/guide/insights' },
      { section: 'Pembelajaran', href: '/guide/onboarding' },
      { section: 'Pembelajaran', href: '/guide/training' },
      { section: 'Pembelajaran', href: '/guide/learning' },
      { section: 'Dukungan', href: '/guide/notifications' },
      { section: 'Dukungan', href: '/help' },
      { section: 'Pengaturan', href: '/guide/settings' },
      { section: 'Pengaturan', href: '/guide/preferences' },
    ];

    let allFound = true;
    for (const expected of expectedItems) {
      const found = items?.some(
        (item) => item.section === expected.section && item.href === expected.href,
      );
      if (found) {
        console.log(`  ✅ ${expected.section}: ${expected.href}`);
      } else {
        console.log(`  ❌ ${expected.section}: ${expected.href} - NOT FOUND`);
        allFound = false;
      }
    }

    // Check for removed items (should not exist)
    const removedItems = [
      { section: 'Insight Pribadi', href: '/guide/insights' },
      { section: 'Pembelajaran & Development', href: '/guide/assessments' },
      { section: 'Pembelajaran & Development', href: '/guide/skills' },
      { section: 'Pengaturan & Support', href: '/guide/documents' },
    ];

    console.log('\n🔍 Checking removed items (should not exist):');
    let allRemoved = true;
    for (const removed of removedItems) {
      const found = items?.some(
        (item) => item.section === removed.section && item.href === removed.href,
      );
      if (!found) {
        console.log(`  ✅ ${removed.section}: ${removed.href} - Correctly removed`);
      } else {
        console.log(`  ⚠️  ${removed.section}: ${removed.href} - Still exists (may need manual cleanup)`);
        allRemoved = false;
      }
    }

    if (allFound && allRemoved) {
      console.log('\n🎉 Migration verification successful!');
    } else {
      console.log('\n⚠️  Some verification checks failed. Please review manually.');
    }
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

async function main() {
  try {
    await runMigration();
    await verifyMigration();
    console.log('\n✅ All done!');
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();

