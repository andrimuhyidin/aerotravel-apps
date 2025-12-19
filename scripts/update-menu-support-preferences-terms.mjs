#!/usr/bin/env node

/**
 * Update Menu: Rename Support to Dukungan, Add Terms to Pengaturan, Move Preferences to Pengaturan
 * - Rename section "Support" to "Dukungan"
 * - Add "Syarat & Ketentuan" to Pengaturan section
 * - Move "Preferensi" to Pengaturan section
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

async function updateMenu() {
  console.log('🚀 Updating Menu: Support → Dukungan, Add Terms, Move Preferences...\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    console.log('📦 Executing updates...\n');

    // ============================================
    // 1. RENAME SECTION "SUPPORT" TO "DUKUNGAN"
    // ============================================
    console.log('1️⃣  Renaming Support section to Dukungan...');
    
    const { error: renameError, count: renameCount } = await supabase
      .from('guide_menu_items')
      .update({ section: 'Dukungan' })
      .eq('section', 'Support')
      .select('*', { count: 'exact', head: true });
    
    if (renameError) {
      console.warn(`   ⚠️  Rename warning: ${renameError.message}`);
    } else if (renameCount && renameCount > 0) {
      console.log(`   ✅ Renamed ${renameCount} item(s) from Support to Dukungan`);
    } else {
      console.log(`   ℹ️  No items found in Support section`);
    }

    // ============================================
    // 2. ADD "SYARAT & KETENTUAN" TO PENGATURAN
    // ============================================
    console.log('\n2️⃣  Adding "Syarat & Ketentuan" to Pengaturan section...');
    
    const { data: existingTerms } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('href', '/legal/terms')
      .maybeSingle();

    if (existingTerms) {
      // Update if exists
      const { error } = await supabase
        .from('guide_menu_items')
        .update({
          section: 'Pengaturan',
          display_order: 4,
          label: 'Syarat & Ketentuan',
          icon_name: 'FileText',
          description: 'Syarat dan ketentuan penggunaan',
        })
        .eq('href', '/legal/terms');
      
      if (error) {
        console.warn(`   ⚠️  Terms update warning: ${error.message}`);
      } else {
        console.log(`   ✅ Updated "Syarat & Ketentuan" to Pengaturan section (order: 4)`);
      }
    } else {
      // Insert if not exists
      const { error } = await supabase
        .from('guide_menu_items')
        .insert({
          branch_id: null,
          section: 'Pengaturan',
          href: '/legal/terms',
          label: 'Syarat & Ketentuan',
          icon_name: 'FileText',
          description: 'Syarat dan ketentuan penggunaan',
          display_order: 4,
          is_active: true,
        });
      
      if (error) {
        console.warn(`   ⚠️  Terms insert warning: ${error.message}`);
      } else {
        console.log(`   ✅ Inserted "Syarat & Ketentuan" to Pengaturan section (order: 4)`);
      }
    }

    // ============================================
    // 3. MOVE "PREFERENSI" TO PENGATURAN
    // ============================================
    console.log('\n3️⃣  Moving "Preferensi" to Pengaturan section...');
    
    // Check if preferences menu exists
    const { data: existingPrefs } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('href', '/guide/preferences')
      .maybeSingle();

    if (existingPrefs) {
      // Update to Pengaturan section
      const { error } = await supabase
        .from('guide_menu_items')
        .update({
          section: 'Pengaturan',
          display_order: 5,
          label: 'Preferensi',
          icon_name: 'Settings',
          description: 'Preferensi kerja dan notifikasi',
        })
        .eq('href', '/guide/preferences');
      
      if (error) {
        console.warn(`   ⚠️  Preferences update warning: ${error.message}`);
      } else {
        console.log(`   ✅ Moved "Preferensi" to Pengaturan section (order: 5)`);
      }
    } else {
      // Insert if not exists
      const { error } = await supabase
        .from('guide_menu_items')
        .insert({
          branch_id: null,
          section: 'Pengaturan',
          href: '/guide/preferences',
          label: 'Preferensi',
          icon_name: 'Settings',
          description: 'Preferensi kerja dan notifikasi',
          display_order: 5,
          is_active: true,
        });
      
      if (error) {
        console.warn(`   ⚠️  Preferences insert warning: ${error.message}`);
      } else {
        console.log(`   ✅ Inserted "Preferensi" to Pengaturan section (order: 5)`);
      }
    }

    // ============================================
    // 4. REORDER PENGATURAN SECTION
    // ============================================
    console.log('\n4️⃣  Reordering Pengaturan section...');
    
    const pengaturanUpdates = [
      { href: '/guide/settings', order: 1, label: 'Pengaturan Aplikasi' },
      { href: '/guide/settings#language', order: 2, label: 'Pengaturan Bahasa' },
      { href: '/legal/privacy', order: 3, label: 'Kebijakan Privasi' },
      { href: '/legal/terms', order: 4, label: 'Syarat & Ketentuan' },
      { href: '/guide/preferences', order: 5, label: 'Preferensi' },
    ];

    for (const item of pengaturanUpdates) {
      const { error } = await supabase
        .from('guide_menu_items')
        .update({
          display_order: item.order,
          label: item.label,
        })
        .eq('href', item.href)
        .eq('section', 'Pengaturan');
      
      if (error) {
        console.warn(`   ⚠️  Update warning for ${item.href}: ${error.message}`);
      } else {
        console.log(`   ✅ Updated ${item.label} to order ${item.order}`);
      }
    }

    // ============================================
    // 5. VERIFICATION
    // ============================================
    console.log('\n🔍 Verifying results...\n');

    const sections = ['Akun', 'Dukungan', 'Pengaturan'];
    
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

    console.log('\n🎉 Menu update completed!');

  } catch (error) {
    console.error(`\n❌ Update failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error instanceof Error ? error.stack : '');
    process.exit(1);
  }
}

updateMenu().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
