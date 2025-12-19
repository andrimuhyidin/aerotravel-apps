#!/usr/bin/env node

/**
 * Remove "Pengaturan & Support" Section
 * - Delete all menu items in "Pengaturan & Support" section
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
  console.log('🚀 Removing "Pengaturan & Support" Section...\n');
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
    // 1. HAPUS SEMUA MENU ITEMS DARI SECTION "PENGATURAN & SUPPORT"
    // ============================================
    console.log('1️⃣  Removing "Pengaturan & Support" section menu items...');
    
    // Delete all items in "Pengaturan & Support" section
    const { error: deleteError, count: deleteCount } = await supabase
      .from('guide_menu_items')
      .delete()
      .eq('section', 'Pengaturan & Support')
      .select('*', { count: 'exact', head: true });
    
    if (deleteError) {
      console.warn(`   ⚠️  Delete warning: ${deleteError.message}`);
    } else if (deleteCount && deleteCount > 0) {
      console.log(`   ✅ Deleted ${deleteCount} item(s) from "Pengaturan & Support" section`);
    } else {
      console.log(`   ℹ️  No items found in "Pengaturan & Support" section`);
    }

    // Also try variations of the section name
    const sectionVariations = [
      'Pengaturan & Support',
      'Pengaturan dan Support',
      'Pengaturan dan Dukungan',
    ];

    for (const sectionName of sectionVariations) {
      const { error, count } = await supabase
        .from('guide_menu_items')
        .delete()
        .eq('section', sectionName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.warn(`   ⚠️  Delete warning for "${sectionName}": ${error.message}`);
      } else if (count && count > 0) {
        console.log(`   ✅ Deleted ${count} item(s) from "${sectionName}" section`);
      }
    }

    // ============================================
    // 2. VERIFICATION
    // ============================================
    console.log('\n🔍 Verifying results...\n');

    const sections = ['Akun', 'Pengaturan'];
    
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

    // Check if "Pengaturan & Support" section still exists
    const { data: pengaturanSupportItems } = await supabase
      .from('guide_menu_items')
      .select('*')
      .or('section.eq.Pengaturan & Support,section.eq.Pengaturan dan Support,section.eq.Pengaturan dan Dukungan')
      .eq('is_active', true);
    
    if (pengaturanSupportItems && pengaturanSupportItems.length > 0) {
      console.log(`\n   ⚠️  Warning: "Pengaturan & Support" section still has ${pengaturanSupportItems.length} item(s)`);
      pengaturanSupportItems.forEach(item => {
        console.log(`      - [${item.href}] ${item.label} (section: ${item.section})`);
      });
    } else {
      console.log(`\n   ✅ "Pengaturan & Support" section successfully removed`);
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
