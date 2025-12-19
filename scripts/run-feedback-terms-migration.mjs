#!/usr/bin/env node

/**
 * Run Feedback & Terms Menu Migration
 * Executes migration: 20250120000004_040-guide-menu-feedback-terms-fix.sql
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌');
  process.exit(1);
}

const migrationFile = 'supabase/migrations/20250120000004_040-guide-menu-feedback-terms-fix.sql';

async function runMigration() {
  console.log('🚀 Running Feedback & Terms Menu Migration...\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    console.log('📦 Executing migration operations...\n');

    // Step 1: Delete feedback from Akun section
    console.log('1️⃣  Deleting feedback from Akun section...');
    const { error: deleteError, count: deleteCount } = await supabase
      .from('guide_menu_items')
      .delete()
      .eq('href', '/guide/feedback')
      .eq('section', 'Akun')
      .select('*', { count: 'exact', head: true });
    
    if (deleteError) {
      console.warn(`   ⚠️  Delete warning: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Deleted ${deleteCount || 0} feedback item(s) from Akun section`);
    }

    // Step 2: Insert or update feedback in Pengaturan section
    console.log('\n2️⃣  Inserting/Updating feedback in Pengaturan section...');
    const feedbackData = {
      branch_id: null,
      section: 'Pengaturan',
      href: '/guide/feedback',
      label: 'Feedback & Saran',
      icon_name: 'MessageSquare',
      description: 'Berikan feedback untuk perbaikan',
      display_order: 6,
      is_active: true,
    };

    // First try to update existing
    const { data: existingFeedback, error: checkError } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('href', '/guide/feedback')
      .maybeSingle();

    if (existingFeedback) {
      // Update existing
      const { error: updateError } = await supabase
        .from('guide_menu_items')
        .update({
          section: 'Pengaturan',
          display_order: 6,
          label: 'Feedback & Saran',
          icon_name: 'MessageSquare',
          description: 'Berikan feedback untuk perbaikan',
        })
        .eq('href', '/guide/feedback');
      
      if (updateError) {
        console.warn(`   ⚠️  Update error: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated feedback to Pengaturan section`);
      }
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from('guide_menu_items')
        .insert(feedbackData);
      
      if (insertError) {
        console.warn(`   ⚠️  Insert error: ${insertError.message}`);
      } else {
        console.log(`   ✅ Inserted feedback in Pengaturan section`);
      }
    }

    // Step 3: Insert or update Terms menu item
    console.log('\n3️⃣  Inserting/Updating Terms menu item...');
    const termsData = {
      branch_id: null,
      section: 'Pengaturan',
      href: '/legal/terms',
      label: 'Syarat dan Ketentuan',
      icon_name: 'FileText',
      description: 'Syarat dan ketentuan penggunaan',
      display_order: 7,
      is_active: true,
    };

    const { data: existingTerms, error: checkTermsError } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('href', '/legal/terms')
      .maybeSingle();

    if (existingTerms) {
      // Update existing
      const { error: updateTermsError } = await supabase
        .from('guide_menu_items')
        .update({
          section: 'Pengaturan',
          display_order: 7,
          label: 'Syarat dan Ketentuan',
          icon_name: 'FileText',
          description: 'Syarat dan ketentuan penggunaan',
        })
        .eq('href', '/legal/terms');
      
      if (updateTermsError) {
        console.warn(`   ⚠️  Update error: ${updateTermsError.message}`);
      } else {
        console.log(`   ✅ Updated Terms to Pengaturan section`);
      }
    } else {
      // Insert new
      const { error: insertTermsError } = await supabase
        .from('guide_menu_items')
        .insert(termsData);
      
      if (insertTermsError) {
        console.warn(`   ⚠️  Insert error: ${insertTermsError.message}`);
      } else {
        console.log(`   ✅ Inserted Terms in Pengaturan section`);
      }
    }

    // Step 4: Reorder other menu items in Pengaturan section
    console.log('\n4️⃣  Reordering menu items in Pengaturan section...');
    
    const reorderUpdates = [
      { href: '/guide/settings', order: 2 },
      { href: '/legal/privacy', order: 4 },
      { href: '/help', order: 5 },
      { href: '/guide/feedback', order: 6 },
      { href: '/legal/terms', order: 7 },
    ];

    for (const update of reorderUpdates) {
      const { error: reorderError } = await supabase
        .from('guide_menu_items')
        .update({ display_order: update.order })
        .eq('section', 'Pengaturan')
        .eq('href', update.href);
      
      if (reorderError) {
        console.warn(`   ⚠️  Reorder warning for ${update.href}: ${reorderError.message}`);
      } else {
        console.log(`   ✅ Updated order for ${update.href} to ${update.order}`);
      }
    }

    // Execute SQL via Supabase RPC (if available) or direct query
    // Since Supabase REST API doesn't support raw SQL, we'll use the service role
    // to execute via PostgREST or direct connection
    

    // Verify results
    console.log(`\n🔍 Verifying migration results...`);
    
    const { data: feedbackItem, error: feedbackError } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('href', '/guide/feedback')
      .maybeSingle();

    const { data: termsItem, error: termsError } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('href', '/legal/terms')
      .maybeSingle();

    if (!feedbackError && feedbackItem) {
      console.log(`   ✅ Feedback menu item found in section: ${feedbackItem.section} (order: ${feedbackItem.display_order})`);
    } else {
      console.log(`   ⚠️  Feedback menu item not found or error: ${feedbackError?.message}`);
    }

    if (!termsError && termsItem) {
      console.log(`   ✅ Terms menu item found in section: ${termsItem.section} (order: ${termsItem.display_order})`);
    } else {
      console.log(`   ⚠️  Terms menu item not found or error: ${termsError?.message}`);
    }

    console.log('\n🎉 Migration verification complete!');

  } catch (error) {
    console.error(`\n❌ Migration failed: ${error.message}`);
    console.error(error.stack);
    console.log('\n💡 Alternative: Run migration manually via Supabase Dashboard SQL Editor');
    process.exit(1);
  }
}

runMigration().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
