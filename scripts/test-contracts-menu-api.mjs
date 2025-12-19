#!/usr/bin/env node
/**
 * Test Contracts Menu API
 * Verify that /api/guide/menu-items returns contracts menu item
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
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testMenuItems() {
  console.log('🔍 Testing Menu Items API Response...\n');

  // Simulate API route logic
  const { data: items, error } = await supabase
    .from('guide_menu_items')
    .select('*')
    .eq('is_active', true)
    .order('section', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) {
    console.error('❌ Error fetching menu items:', error.message);
    return;
  }

  console.log(`📊 Total menu items: ${items?.length || 0}\n`);

  // Apply filters like in API route
  const uniqueItems = (items || []).filter((item) => {
    // Exclude list from API route
    const excluded = [
      '/guide/broadcasts',
      '/guide/profile/notifications',
      '/guide/license/apply',
      '/guide/ratings',
      '/guide/documents',
      '/guide/incidents',
      '/guide/assessments',
      '/guide/skills',
      '/guide/settings#language',
    ];

    if (excluded.includes(item.href)) {
      return false;
    }

    // Exclude insights from "Insight Pribadi" section
    if (item.href === '/guide/insights' && item.section === 'Insight Pribadi') {
      return false;
    }

    return true;
  });

  // Group by section
  const grouped = uniqueItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {});

  // Check Akun section
  const akunItems = grouped['Akun'] || [];
  console.log(`📋 Menu items di section "Akun": ${akunItems.length}`);
  
  const contractsItem = akunItems.find((item) => item.href === '/guide/contracts');
  
  if (contractsItem) {
    console.log('\n✅ Menu "Kontrak Kerja" DITEMUKAN di API response!');
    console.log('\nDetail:');
    console.log(`  - Label: ${contractsItem.label}`);
    console.log(`  - Href: ${contractsItem.href}`);
    console.log(`  - Icon: ${contractsItem.icon_name}`);
    console.log(`  - Display Order: ${contractsItem.display_order}`);
    console.log(`  - Is Active: ${contractsItem.is_active}`);
    
    console.log('\n📋 Urutan menu di section "Akun":');
    akunItems
      .sort((a, b) => (a.display_order || 999) - (b.display_order || 999))
      .forEach((item, idx) => {
        const marker = item.href === '/guide/contracts' ? '👉' : '  ';
        console.log(`${marker} ${idx + 1}. [Order: ${item.display_order}] ${item.label} - ${item.href}`);
      });
  } else {
    console.log('\n❌ Menu "Kontrak Kerja" TIDAK DITEMUKAN di API response!');
    console.log('\n💡 Kemungkinan masalah:');
    console.log('   1. Menu item terfilter oleh exclusion list');
    console.log('   2. Menu item tidak ada di section "Akun"');
    console.log('   3. Menu item is_active = false');
    
    console.log('\n📋 Semua items di section "Akun" (sebelum filter):');
    const allAkunItems = (items || []).filter((item) => item.section === 'Akun');
    allAkunItems.forEach((item, idx) => {
      console.log(`  ${idx + 1}. [Order: ${item.display_order}] ${item.label} - ${item.href} (active: ${item.is_active})`);
    });
  }
}

testMenuItems().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
