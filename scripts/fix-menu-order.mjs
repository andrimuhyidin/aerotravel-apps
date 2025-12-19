#!/usr/bin/env node
/**
 * Fix Menu Order
 * Ensure all menus in Akun section have correct order
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

async function fixMenuOrder() {
  console.log('🔧 Fixing Menu Order...\n');

  // Get all Akun section menus
  const { data: akunMenus, error } = await supabase
    .from('guide_menu_items')
    .select('*')
    .eq('section', 'Akun')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📦 Found ${akunMenus?.length || 0} active menus in Akun section\n`);

  // Define correct order
  const orderMap = {
    '/guide/profile/edit': 1,
    '/guide/profile/password': 2,
    '/guide/feedback': 3,
    '/guide/id-card': 5,
    '/guide/insights': 6,
  };

  // Update each menu
  for (const menu of akunMenus || []) {
    const expectedOrder = orderMap[menu.href];
    if (expectedOrder && menu.display_order !== expectedOrder) {
      console.log(`   Updating ${menu.label}: order ${menu.display_order} → ${expectedOrder}`);
      const { error: updateError } = await supabase
        .from('guide_menu_items')
        .update({ display_order: expectedOrder })
        .eq('id', menu.id);

      if (updateError) {
        console.log(`   ❌ Error updating ${menu.label}: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated ${menu.label}`);
      }
    } else if (!expectedOrder) {
      console.log(`   ⚠️  ${menu.label} (${menu.href}) not in order map, keeping order ${menu.display_order}`);
    }
  }

  // Ensure Insight & Performance exists
  const { data: insightMenu } = await supabase
    .from('guide_menu_items')
    .select('*')
    .eq('href', '/guide/insights')
    .eq('section', 'Akun')
    .maybeSingle();

  if (!insightMenu) {
    console.log('\n   Creating Insight & Performance menu...');
    const { error: insertError } = await supabase
      .from('guide_menu_items')
      .insert({
        branch_id: null,
        section: 'Akun',
        href: '/guide/insights',
        label: 'Insight & Performance',
        icon_name: 'BarChart3',
        description: 'Analisis performa lengkap, trend bulanan, dan rekomendasi',
        display_order: 6,
        is_active: true,
      });

    if (insertError) {
      console.log(`   ❌ Error creating menu: ${insertError.message}`);
    } else {
      console.log(`   ✅ Created Insight & Performance menu`);
    }
  }

  console.log('\n✅ Menu order fixed!');
}

fixMenuOrder().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
