#!/usr/bin/env node

/**
 * Restore Support/Dukungan Section
 * - Create Support section with menu items: Onboarding, Learning Hub, Saran & Masukan, Pusat Bantuan
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

async function restoreSupport() {
  console.log('🚀 Restoring Support/Dukungan Section...\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    console.log('📦 Executing restoration...\n');

    // ============================================
    // 1. CREATE SUPPORT SECTION MENU ITEMS
    // ============================================
    console.log('1️⃣  Creating Support section menu items...');
    
    const supportItems = [
      { href: '/guide/onboarding', order: 1, label: 'Onboarding', icon: 'GraduationCap', description: 'Panduan onboarding untuk guide baru' },
      { href: '/guide/learning', order: 2, label: 'Learning Hub', icon: 'BookOpen', description: 'Panduan, SOP, dan tips untuk Guide' },
      { href: '/guide/feedback', order: 3, label: 'Saran & Masukan', icon: 'MessageSquare', description: 'Berikan feedback untuk perbaikan' },
      { href: '/help', order: 4, label: 'Pusat Bantuan', icon: 'HelpCircle', description: 'Pusat bantuan dan FAQ' },
    ];

    for (const item of supportItems) {
      // Check if exists in any section
      const { data: existing } = await supabase
        .from('guide_menu_items')
        .select('*')
        .eq('href', item.href)
        .maybeSingle();

      if (existing) {
        // Update to Support section
        const { error } = await supabase
          .from('guide_menu_items')
          .update({
            section: 'Support',
            display_order: item.order,
            label: item.label,
            icon_name: item.icon,
            description: item.description,
          })
          .eq('href', item.href);
        
        if (error) {
          console.warn(`   ⚠️  Update warning for ${item.href}: ${error.message}`);
        } else {
          console.log(`   ✅ Updated ${item.label} to Support section (order: ${item.order})`);
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('guide_menu_items')
          .insert({
            branch_id: null,
            section: 'Support',
            href: item.href,
            label: item.label,
            icon_name: item.icon,
            description: item.description,
            display_order: item.order,
            is_active: true,
          });
        
        if (error) {
          console.warn(`   ⚠️  Insert warning for ${item.href}: ${error.message}`);
        } else {
          console.log(`   ✅ Inserted ${item.label} to Support section (order: ${item.order})`);
        }
      }
    }

    // ============================================
    // 2. UPDATE API ROUTE TO INCLUDE SUPPORT
    // ============================================
    console.log('\n2️⃣  Support section menu items created!');
    console.log('   ℹ️  Note: API route needs to include Support in sectionOrder');

    // ============================================
    // 3. VERIFICATION
    // ============================================
    console.log('\n🔍 Verifying results...\n');

    const sections = ['Akun', 'Support', 'Pengaturan'];
    
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

    console.log('\n🎉 Support section restoration completed!');

  } catch (error) {
    console.error(`\n❌ Restoration failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error instanceof Error ? error.stack : '');
    process.exit(1);
  }
}

restoreSupport().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
