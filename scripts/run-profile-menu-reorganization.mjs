#!/usr/bin/env node

/**
 * Run Profile Menu Reorganization Migration
 * Executes migration: 20250120000005_041-guide-menu-profile-reorganization.sql
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

async function runMigration() {
  console.log('🚀 Running Profile Menu Reorganization Migration...\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    console.log('📦 Executing migration operations...\n');

    // ============================================
    // HAPUS MENU YANG TIDAK DIPERLUKAN
    // ============================================
    console.log('0️⃣  Removing unnecessary menu items...');
    
    const itemsToRemove = [
      '/guide/ratings', // Sudah digabung ke Insights
      '/guide/insights', // Sudah di widget dengan link
      '/guide/performance', // Sudah digabung ke Insights
      '/guide/preferences', // Sudah digabung ke Settings
      '/guide/documents', // Sudah digabung ke Edit Profile
      '/guide/incidents', // Sudah digabung ke Help
      '/guide/assessments', // Sudah digabung ke Learning Hub
      '/guide/skills', // Sudah digabung ke Learning Hub
      '/legal/terms', // Tidak disebutkan di requirement baru
    ];

    for (const href of itemsToRemove) {
      const { error, count } = await supabase
        .from('guide_menu_items')
        .delete()
        .eq('href', href)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.warn(`   ⚠️  Delete warning for ${href}: ${error.message}`);
      } else if (count && count > 0) {
        console.log(`   ✅ Deleted ${href} (${count} item(s))`);
      }
    }

    // ============================================
    // SECTION: AKUN
    // ============================================
    console.log('\n1️⃣  Reorganizing Akun section...');
    
    const akunUpdates = [
      { href: '/guide/profile/edit', order: 1, label: 'Edit Profile' },
      { href: '/guide/profile/password', order: 2, label: 'Ubah Password' },
      { href: '/guide/id-card', order: 3, label: 'ID Card Guide' },
    ];

    for (const item of akunUpdates) {
      const { error } = await supabase
        .from('guide_menu_items')
        .update({
          section: 'Akun',
          display_order: item.order,
          label: item.label,
        })
        .eq('href', item.href);
      
      if (error) {
        console.warn(`   ⚠️  Update warning for ${item.href}: ${error.message}`);
      } else {
        console.log(`   ✅ Updated ${item.label} to Akun section (order: ${item.order})`);
      }
    }

    // ============================================
    // SECTION: SUPPORT (BARU)
    // ============================================
    console.log('\n2️⃣  Creating Support section...');
    
    const supportUpdates = [
      { href: '/guide/onboarding', order: 1, label: 'Onboarding' },
      { href: '/guide/learning', order: 2, label: 'Learning Hub' },
      { href: '/guide/feedback', order: 3, label: 'Saran & Masukan' },
      { href: '/help', order: 4, label: 'Pusat Bantuan' },
    ];

    for (const item of supportUpdates) {
      // Check if exists
      const { data: existing } = await supabase
        .from('guide_menu_items')
        .select('*')
        .eq('href', item.href)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('guide_menu_items')
          .update({
            section: 'Support',
            display_order: item.order,
            label: item.label,
          })
          .eq('href', item.href);
        
        if (error) {
          console.warn(`   ⚠️  Update warning for ${item.href}: ${error.message}`);
        } else {
          console.log(`   ✅ Updated ${item.label} to Support section (order: ${item.order})`);
        }
      } else {
        // Insert if not exists
        const { error } = await supabase
          .from('guide_menu_items')
          .insert({
            branch_id: null,
            section: 'Support',
            href: item.href,
            label: item.label,
            icon_name: item.href === '/guide/onboarding' ? 'GraduationCap' :
                      item.href === '/guide/learning' ? 'BookOpen' :
                      item.href === '/guide/feedback' ? 'MessageSquare' :
                      'HelpCircle',
            description: null,
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
    // SECTION: PENGATURAN
    // ============================================
    console.log('\n3️⃣  Reorganizing Pengaturan section...');
    
    // Update Settings
    const { error: settingsError } = await supabase
      .from('guide_menu_items')
      .update({
        section: 'Pengaturan',
        display_order: 1,
        label: 'Pengaturan Aplikasi',
      })
      .eq('href', '/guide/settings');
    
    if (settingsError) {
      console.warn(`   ⚠️  Settings update warning: ${settingsError.message}`);
    } else {
      console.log(`   ✅ Updated Settings to Pengaturan section (order: 1)`);
    }

    // Insert or update Language Settings
    const { data: existingLang } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('href', '/guide/settings#language')
      .maybeSingle();

    if (existingLang) {
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
        console.log(`   ✅ Updated Language Settings to Pengaturan section (order: 2)`);
      }
    } else {
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
        console.log(`   ✅ Inserted Language Settings to Pengaturan section (order: 2)`);
      }
    }

    // Update Privacy Policy
    const { error: privacyError } = await supabase
      .from('guide_menu_items')
      .update({
        section: 'Pengaturan',
        display_order: 3,
        label: 'Kebijakan Privasi',
      })
      .eq('href', '/legal/privacy');
    
    if (privacyError) {
      console.warn(`   ⚠️  Privacy update warning: ${privacyError.message}`);
    } else {
      console.log(`   ✅ Updated Privacy Policy to Pengaturan section (order: 3)`);
    }

    // ============================================
    // VERIFICATION
    // ============================================
    console.log('\n🔍 Verifying migration results...\n');

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

    console.log('\n🎉 Migration verification complete!');

  } catch (error) {
    console.error(`\n❌ Migration failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

runMigration().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
