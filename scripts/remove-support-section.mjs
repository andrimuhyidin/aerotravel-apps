#!/usr/bin/env node

/**
 * Remove Support Section and Add Language Menu to Pengaturan
 * - Remove Support section (move items elsewhere or delete)
 * - Add "Pengaturan Bahasa" to Pengaturan section
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
  console.log('🚀 Removing Support Section and Adding Language Menu...\n');
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
    // 1. HAPUS SEMUA MENU ITEMS DARI SECTION "SUPPORT"
    // ============================================
    console.log('1️⃣  Removing Support section menu items...');
    
    const supportHrefs = [
      '/guide/onboarding',
      '/guide/learning',
      '/guide/feedback',
      '/help',
    ];

    for (const href of supportHrefs) {
      const { error: deleteError, count: deleteCount } = await supabase
        .from('guide_menu_items')
        .delete()
        .eq('href', href)
        .eq('section', 'Support')
        .select('*', { count: 'exact', head: true });
      
      if (deleteError) {
        console.warn(`   ⚠️  Delete warning for ${href}: ${deleteError.message}`);
      } else if (deleteCount && deleteCount > 0) {
        console.log(`   ✅ Deleted ${href} from Support section (${deleteCount} item(s))`);
      }
    }

    // Also delete any remaining items in Support section
    const { error: deleteAllError, count: deleteAllCount } = await supabase
      .from('guide_menu_items')
      .delete()
      .eq('section', 'Support')
      .select('*', { count: 'exact', head: true });
    
    if (deleteAllError) {
      console.warn(`   ⚠️  Delete all warning: ${deleteAllError.message}`);
    } else if (deleteAllCount && deleteAllCount > 0) {
      console.log(`   ✅ Deleted ${deleteAllCount} remaining item(s) from Support section`);
    }

    // ============================================
    // 2. TAMBAHKAN "PENGATURAN BAHASA" KE SECTION PENGATURAN
    // ============================================
    console.log('\n2️⃣  Adding "Pengaturan Bahasa" to Pengaturan section...');
    
    const { data: existingLang } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('href', '/guide/settings#language')
      .maybeSingle();

    if (existingLang) {
      // Update if exists
      const { error } = await supabase
        .from('guide_menu_items')
        .update({
          section: 'Pengaturan',
          display_order: 2,
          label: 'Pengaturan Bahasa',
          icon_name: 'Globe',
          description: 'Atur bahasa aplikasi',
        })
        .eq('href', '/guide/settings#language');
      
      if (error) {
        console.warn(`   ⚠️  Language update warning: ${error.message}`);
      } else {
        console.log(`   ✅ Updated "Pengaturan Bahasa" to Pengaturan section (order: 2)`);
      }
    } else {
      // Insert if not exists
      const { error } = await supabase
        .from('guide_menu_items')
        .insert({
          branch_id: null,
          section: 'Pengaturan',
          href: '/guide/settings#language',
          label: 'Pengaturan Bahasa',
          icon_name: 'Globe',
          description: 'Atur bahasa aplikasi',
          display_order: 2,
          is_active: true,
        });
      
      if (error) {
        console.warn(`   ⚠️  Language insert warning: ${error.message}`);
      } else {
        console.log(`   ✅ Inserted "Pengaturan Bahasa" to Pengaturan section (order: 2)`);
      }
    }

    // ============================================
    // 3. REORDER MENU PENGATURAN
    // ============================================
    console.log('\n3️⃣  Reordering Pengaturan section...');
    
    const pengaturanUpdates = [
      { href: '/guide/settings', order: 1, label: 'Pengaturan Aplikasi' },
      { href: '/guide/settings#language', order: 2, label: 'Pengaturan Bahasa' },
      { href: '/legal/privacy', order: 3, label: 'Kebijakan Privasi' },
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
    // 4. VERIFICATION
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

    // Check if Support section still exists
    const { data: supportItems } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('section', 'Support')
      .eq('is_active', true);
    
    if (supportItems && supportItems.length > 0) {
      console.log(`\n   ⚠️  Warning: Support section still has ${supportItems.length} item(s)`);
    } else {
      console.log(`\n   ✅ Support section successfully removed`);
    }

    // Check language menu
    const { data: langMenu } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('href', '/guide/settings#language')
      .maybeSingle();
    
    if (langMenu) {
      console.log(`   ✅ "Pengaturan Bahasa" menu found in section: ${langMenu.section} (order: ${langMenu.display_order})`);
    } else {
      console.log(`   ⚠️  Warning: "Pengaturan Bahasa" menu not found`);
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
