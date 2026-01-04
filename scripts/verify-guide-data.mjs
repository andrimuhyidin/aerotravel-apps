#!/usr/bin/env node

/**
 * Verify Guide App Seed Data
 * Checks if seed data exists in database
 * 
 * Usage:
 *   node scripts/verify-guide-data.mjs
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

async function verifyData() {
  console.log('🔍 Verifying Guide App seed data...\n');

  const results = {
    quickActions: { count: 0, status: '❌' },
    menuItems: { count: 0, status: '❌' },
    challenges: { count: 0, status: '❌' },
    promos: { count: 0, status: '❌' },
  };

  try {
    // Check Quick Actions
    const { data: quickActions, error: qaError } = await supabase
      .from('guide_quick_actions')
      .select('id', { count: 'exact', head: false })
      .eq('is_active', true);

    if (!qaError) {
      results.quickActions.count = quickActions?.length || 0;
      results.quickActions.status = results.quickActions.count > 0 ? '✅' : '⚠️';
    } else {
      console.error('Error checking quick actions:', qaError.message);
    }

    // Check Menu Items
    const { data: menuItems, error: miError } = await supabase
      .from('guide_menu_items')
      .select('id', { count: 'exact', head: false })
      .eq('is_active', true);

    if (!miError) {
      results.menuItems.count = menuItems?.length || 0;
      results.menuItems.status = results.menuItems.count > 0 ? '✅' : '⚠️';
    } else {
      console.error('Error checking menu items:', miError.message);
    }

    // Check Challenges
    const { data: challenges, error: chError } = await supabase
      .from('guide_challenges')
      .select('id', { count: 'exact', head: false })
      .eq('status', 'active');

    if (!chError) {
      results.challenges.count = challenges?.length || 0;
      results.challenges.status = results.challenges.count > 0 ? '✅' : '⚠️';
    } else {
      console.error('Error checking challenges:', chError.message);
    }

    // Check Promos
    const { data: promos, error: prError } = await supabase
      .from('guide_promos')
      .select('id', { count: 'exact', head: false })
      .eq('is_active', true);

    if (!prError) {
      results.promos.count = promos?.length || 0;
      results.promos.status = results.promos.count > 0 ? '✅' : '⚠️';
    } else {
      console.error('Error checking promos:', prError.message);
    }

    // Print results
    console.log('Results:');
    console.log(`  ${results.quickActions.status} Quick Actions: ${results.quickActions.count} active`);
    console.log(`  ${results.menuItems.status} Menu Items: ${results.menuItems.count} active`);
    console.log(`  ${results.challenges.status} Challenges: ${results.challenges.count} active`);
    console.log(`  ${results.promos.status} Promos: ${results.promos.count} active`);
    console.log('');

    // Summary
    const allGood = Object.values(results).every(r => r.count > 0);
    if (allGood) {
      console.log('✅ All seed data exists!');
      return 0;
    } else {
      console.log('⚠️  Some seed data is missing. Run: psql -d your_database -f scripts/seed/guide-app-data.sql');
      return 1;
    }
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
    return 1;
  }
}

verifyData().then(code => process.exit(code));

