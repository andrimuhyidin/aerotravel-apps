#!/usr/bin/env node

/**
 * Fix Menu Language Double Issue
 * - Remove "Pengaturan Bahasa" from Pengaturan section (already in settings page)
 * - Ensure section order: Support first, then Pengaturan
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌');
  process.exit(1);
}

async function fixMenu() {
  console.log('🚀 Fixing Menu Language Double Issue...\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    console.log('📦 Executing fixes...\n');

    // ============================================
    // 1. HAPUS MENU "PENGATURAN BAHASA" DARI SECTION PENGATURAN
    // ============================================
    console.log('1️⃣  Removing duplicate "Pengaturan Bahasa" menu...');
    
    const { error: deleteError, count: deleteCount } = await supabase
      .from('guide_menu_items')
      .delete()
      .eq('href', '/guide/settings#language')
      .select('*', { count: 'exact', head: true });
    
    if (deleteError) {
      console.warn(`   ⚠️  Delete warning: ${deleteError.message}`);
    } else if (deleteCount && deleteCount > 0) {
      console.log(`   ✅ Deleted "Pengaturan Bahasa" menu (${deleteCount} item(s))`);
    } else {
      console.log(`   ℹ️  "Pengaturan Bahasa" menu not found (may already be deleted)`);
    }

    // ============================================
    // 2. PASTIKAN URUTAN SECTION: SUPPORT DULU, BARU PENGATURAN
    // ============================================
    console.log('\n2️⃣  Ensuring section order: Support first, then Pengaturan...');
    
    // Get all menu items grouped by section
    const { data: allItems, error: fetchError } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('is_active', true)
      .order('section', { ascending: true })
      .order('display_order', { ascending: true });
    
    if (fetchError) {
      console.error(`   ❌ Error fetching items: ${fetchError.message}`);
      throw fetchError;
    }

    // Group by section
    const sections = ['Akun', 'Support', 'Pengaturan'];
    const itemsBySection = {};
    
    allItems?.forEach(item => {
      if (sections.includes(item.section)) {
        if (!itemsBySection[item.section]) {
          itemsBySection[item.section] = [];
        }
        itemsBySection[item.section].push(item);
      }
    });

    console.log(`   📋 Found sections: ${Object.keys(itemsBySection).join(', ')}`);
    console.log(`   📋 Expected order: ${sections.join(' → ')}`);

    // ============================================
    // 3. VERIFICATION
    // ============================================
    console.log('\n🔍 Verifying results...\n');

    for (const section of sections) {
      const { data: items, error } = await supabase
        .from('guide_menu_items')
        .select('*')
        .eq('section', section)
        .eq('is_active', true)
        .order('display_order');
      
      if (error) {
        console.warn(`   ⚠️  Error fetching ${section}: ${error.message}`);
      } else {
        console.log(`   📋 ${section} section (${items?.length || 0} items):`);
        items?.forEach(item => {
          console.log(`      ${item.display_order}. [${item.href}] ${item.label}`);
        });
      }
    }

    // Check if language menu still exists
    const { data: langMenu } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('href', '/guide/settings#language')
      .maybeSingle();
    
    if (langMenu) {
      console.log(`\n   ⚠️  Warning: "Pengaturan Bahasa" menu still exists in section: ${langMenu.section}`);
    } else {
      console.log(`\n   ✅ "Pengaturan Bahasa" menu successfully removed`);
    }

    console.log('\n🎉 Fix completed!');

  } catch (error) {
    console.error(`\n❌ Fix failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error instanceof Error ? error.stack : '');
    process.exit(1);
  }
}

fixMenu().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
