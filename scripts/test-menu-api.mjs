#!/usr/bin/env node
/**
 * Test Menu API Output
 * Check what the API actually returns
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
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testMenuAPI() {
  console.log('🧪 Testing Menu API Logic...\n');

  // Simulate what the API does
  const { data: items, error } = await supabase
    .from('guide_menu_items')
    .select('*')
    .eq('is_active', true)
    .order('section', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) {
    console.error('❌ Error fetching menu items:', error);
    return;
  }

  console.log(`📦 Total active menu items: ${items?.length || 0}\n`);

  // Apply filters (same as API)
  const uniqueItems = (items || []).reduce((acc, item) => {
    // Exclude insight pribadi section
    if (item.href === '/guide/insights' && item.section === 'Insight Pribadi') {
      return acc;
    }
    // Exclude Pengaturan Bahasa
    if (item.href === '/guide/settings#language') {
      return acc;
    }
    // Other filters...
    if (item.href === '/guide/broadcasts') return acc;
    if (item.href === '/guide/profile/notifications') return acc;
    if (item.href === '/guide/license/apply') return acc;
    if (item.href === '/guide/ratings') return acc;
    if (item.href === '/guide/documents') return acc;
    if (item.href === '/guide/incidents') return acc;
    if (item.href === '/guide/assessments') return acc;
    if (item.href === '/guide/skills') return acc;

    // Remove duplicates
    if (!acc.find((a) => a.href === item.href && a.section === item.section)) {
      acc.push(item);
    }
    return acc;
  }, []);

  console.log(`📦 After filtering: ${uniqueItems.length} items\n`);

  // Group by section
  const grouped = uniqueItems.reduce((acc, item) => {
    const section = item.section;
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {});

  // Sort sections
  const sectionOrder = ['Akun', 'Dukungan', 'Pengaturan'];
  const menuItems = Object.entries(grouped)
    .sort(([sectionA], [sectionB]) => {
      const indexA = sectionOrder.indexOf(sectionA);
      const indexB = sectionOrder.indexOf(sectionB);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    })
    .map(([section, items]) => {
      // Reorder Pengaturan section
      if (section === 'Pengaturan') {
        const orderMap = {
          '/guide/settings': 1,
          '/guide/preferences': 2,
          '/legal/privacy': 3,
          '/legal/terms': 4,
        };
        items.sort((a, b) => {
          const orderA = orderMap[a.href] ?? a.display_order ?? 999;
          const orderB = orderMap[b.href] ?? b.display_order ?? 999;
          return orderA - orderB;
        });
      } else {
        // Sort by display_order for other sections
        items.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
      }
      return { section, items };
    });

  // Display results
  console.log('📋 Menu Items by Section:\n');
  menuItems.forEach(({ section, items }) => {
    console.log(`📁 ${section} (${items.length} items):`);
    items.forEach((item, index) => {
      console.log(`   ${index + 1}. [${item.display_order}] ${item.label} (${item.href})`);
    });
    console.log('');
  });

  // Check specifically for Insight & Performance
  const akunSection = menuItems.find((m) => m.section === 'Akun');
  if (akunSection) {
    const insightMenu = akunSection.items.find((item) => item.href === '/guide/insights');
    if (insightMenu) {
      console.log('✅ Insight & Performance found in Akun section:');
      console.log(`   Label: ${insightMenu.label}`);
      console.log(`   Order: ${insightMenu.display_order}`);
      console.log(`   Section: ${insightMenu.section}`);
    } else {
      console.log('❌ Insight & Performance NOT found in Akun section!');
      console.log('   Available items in Akun:');
      akunSection.items.forEach((item) => {
        console.log(`   - ${item.label} (${item.href})`);
      });
    }
  } else {
    console.log('❌ Akun section not found!');
  }

  // Check Pengaturan section
  const pengaturanSection = menuItems.find((m) => m.section === 'Pengaturan');
  if (pengaturanSection) {
    const prefsMenu = pengaturanSection.items.find((item) => item.href === '/guide/preferences');
    if (prefsMenu) {
      console.log('\n✅ Preferensi found in Pengaturan section:');
      console.log(`   Label: ${prefsMenu.label}`);
      console.log(`   Order: ${prefsMenu.display_order}`);
    } else {
      console.log('\n❌ Preferensi NOT found in Pengaturan section!');
    }
  }
}

testMenuAPI().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
