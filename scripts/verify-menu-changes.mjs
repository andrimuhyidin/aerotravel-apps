#!/usr/bin/env node
/**
 * Verify Menu Changes
 * Check if all menu changes have been applied correctly
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verifyChanges() {
  console.log('🔍 Verifying Menu Changes...\n');

  let allPassed = true;

  // 1. Check Pengaturan Bahasa is inactive
  console.log('1️⃣  Checking Pengaturan Bahasa...');
  const { data: langMenu, error: langError } = await supabase
    .from('guide_menu_items')
    .select('*')
    .eq('href', '/guide/settings#language')
    .maybeSingle();

  if (langError) {
    console.log(`   ❌ Error: ${langError.message}`);
    allPassed = false;
  } else if (langMenu) {
    if (langMenu.is_active === false) {
      console.log(`   ✅ Pengaturan Bahasa: is_active = false (correct)`);
    } else {
      console.log(`   ❌ Pengaturan Bahasa: is_active = ${langMenu.is_active} (should be false)`);
      allPassed = false;
    }
  } else {
    console.log(`   ⚠️  Pengaturan Bahasa menu not found (may have been deleted)`);
  }

  // 2. Check Preferensi order
  console.log('\n2️⃣  Checking Preferensi...');
  const { data: prefsMenu, error: prefsError } = await supabase
    .from('guide_menu_items')
    .select('*')
    .eq('href', '/guide/preferences')
    .maybeSingle();

  if (prefsError) {
    console.log(`   ❌ Error: ${prefsError.message}`);
    allPassed = false;
  } else if (prefsMenu) {
    const sectionOk = prefsMenu.section === 'Pengaturan';
    const orderOk = prefsMenu.display_order === 2;
    
    if (sectionOk && orderOk) {
      console.log(`   ✅ Preferensi: section = ${prefsMenu.section}, display_order = ${prefsMenu.display_order} (correct)`);
    } else {
      console.log(`   ❌ Preferensi: section = ${prefsMenu.section} (should be Pengaturan), display_order = ${prefsMenu.display_order} (should be 2)`);
      allPassed = false;
    }
  } else {
    console.log(`   ❌ Preferensi menu not found!`);
    allPassed = false;
  }

  // 3. Check Insight & Performance in Akun section
  console.log('\n3️⃣  Checking Insight & Performance...');
  const { data: insightMenu, error: insightError } = await supabase
    .from('guide_menu_items')
    .select('*')
    .eq('href', '/guide/insights')
    .eq('section', 'Akun')
    .maybeSingle();

  if (insightError) {
    console.log(`   ❌ Error: ${insightError.message}`);
    allPassed = false;
  } else if (insightMenu) {
    const sectionOk = insightMenu.section === 'Akun';
    const orderOk = insightMenu.display_order === 6;
    const labelOk = insightMenu.label === 'Insight & Performance';
    
    if (sectionOk && orderOk && labelOk) {
      console.log(`   ✅ Insight & Performance: section = ${insightMenu.section}, display_order = ${insightMenu.display_order}, label = "${insightMenu.label}" (correct)`);
    } else {
      console.log(`   ❌ Insight & Performance:`);
      console.log(`      section = ${insightMenu.section} (should be Akun)`);
      console.log(`      display_order = ${insightMenu.display_order} (should be 6)`);
      console.log(`      label = "${insightMenu.label}" (should be "Insight & Performance")`);
      allPassed = false;
    }
  } else {
    console.log(`   ❌ Insight & Performance menu not found in Akun section!`);
    
    // Check if it exists in other section
    const { data: insightOther } = await supabase
      .from('guide_menu_items')
      .select('*')
      .eq('href', '/guide/insights')
      .maybeSingle();
    
    if (insightOther) {
      console.log(`   ⚠️  Found in section "${insightOther.section}" instead. Need to move it.`);
    } else {
      console.log(`   ⚠️  Menu item not found at all. Need to create it.`);
    }
    allPassed = false;
  }

  // 4. Check ID Card Guide order
  console.log('\n4️⃣  Checking ID Card Guide...');
  const { data: idCardMenu, error: idCardError } = await supabase
    .from('guide_menu_items')
    .select('*')
    .eq('href', '/guide/id-card')
    .eq('section', 'Akun')
    .maybeSingle();

  if (idCardError) {
    console.log(`   ❌ Error: ${idCardError.message}`);
  } else if (idCardMenu) {
    if (idCardMenu.display_order === 5) {
      console.log(`   ✅ ID Card Guide: display_order = ${idCardMenu.display_order} (correct)`);
    } else {
      console.log(`   ⚠️  ID Card Guide: display_order = ${idCardMenu.display_order} (should be 5)`);
    }
  }

  // 5. Show all Akun section menus
  console.log('\n5️⃣  All menus in Akun section:');
  const { data: akunMenus, error: akunError } = await supabase
    .from('guide_menu_items')
    .select('*')
    .eq('section', 'Akun')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (akunError) {
    console.log(`   ❌ Error: ${akunError.message}`);
  } else if (akunMenus && akunMenus.length > 0) {
    akunMenus.forEach((menu, index) => {
      console.log(`   ${index + 1}. [${menu.display_order}] ${menu.label} (${menu.href})`);
    });
  } else {
    console.log(`   ⚠️  No active menus found in Akun section`);
  }

  // 6. Show all Pengaturan section menus
  console.log('\n6️⃣  All menus in Pengaturan section:');
  const { data: pengaturanMenus, error: pengaturanError } = await supabase
    .from('guide_menu_items')
    .select('*')
    .eq('section', 'Pengaturan')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (pengaturanError) {
    console.log(`   ❌ Error: ${pengaturanError.message}`);
  } else if (pengaturanMenus && pengaturanMenus.length > 0) {
    pengaturanMenus.forEach((menu, index) => {
      console.log(`   ${index + 1}. [${menu.display_order}] ${menu.label} (${menu.href})`);
    });
  } else {
    console.log(`   ⚠️  No active menus found in Pengaturan section`);
  }

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ All checks passed!');
  } else {
    console.log('❌ Some checks failed. Please review above.');
    console.log('\n💡 To fix, run migration again:');
    console.log('   node scripts/run-menu-preferences-migration.mjs');
  }
  console.log('='.repeat(60));
}

verifyChanges().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
