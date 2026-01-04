#!/usr/bin/env node

/**
 * Seed Rewards Menu Item
 * Inserts rewards menu item to guide_menu_items table
 * 
 * Usage:
 *   node scripts/seed-rewards-menu.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedRewardsMenu() {
  console.log('🌱 Seeding Rewards Menu Item...\n');

  try {
    // Check if rewards menu item already exists
    const { data: existing } = await supabase
      .from('guide_menu_items')
      .select('id')
      .eq('href', '/guide/rewards')
      .eq('section', 'Akun')
      .maybeSingle();

    if (existing) {
      console.log('  ⏭️  Rewards menu item already exists');
      return 0;
    }

    // Insert rewards menu item
    const { error } = await supabase
      .from('guide_menu_items')
      .insert({
        branch_id: null,
        section: 'Akun',
        href: '/guide/rewards',
        label: 'Reward Points',
        icon_name: 'Gift',
        description: 'Poin reward, katalog, dan riwayat penukaran',
        display_order: 6,
        is_active: true,
      });

    if (error) {
      console.error('  ❌ Failed to insert rewards menu item:', error.message);
      return 1;
    }

    console.log('  ✅ Rewards menu item inserted successfully!');
    return 0;
  } catch (error) {
    console.error('❌ Error seeding rewards menu:', error);
    return 1;
  }
}

seedRewardsMenu().then(code => process.exit(code));

