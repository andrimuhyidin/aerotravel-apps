#!/usr/bin/env node

/**
 * Run Onboarding Guide License Integration Migration (Direct SQL)
 * Updates onboarding steps to integrate with Guide License journey
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running Onboarding Guide License Integration Migration...\n');

  try {
    // 1. Update Step 2: Upload Dokumen
    console.log('📝 Updating Step 2: Upload Dokumen...');
    const { data: step2Update, error: step2Error } = await supabase
      .from('guide_onboarding_steps')
      .update({
        title: 'Upload Dokumen Wajib',
        description: 'Upload dokumen yang diperlukan untuk Guide License',
        instructions: 'Upload 4 dokumen wajib: KTP, SKCK, Surat Kesehatan, dan Foto Formal. Dokumen ini diperlukan untuk mendapatkan AeroTravel Guide License (ATGL).',
        resource_url: '/guide/profile/edit#documents',
        resource_type: 'form',
      })
      .eq('step_order', 2)
      .is('branch_id', null)
      .eq('step_type', 'document')
      .select();

    if (step2Error) {
      console.error('   ❌ Error updating Step 2:', step2Error.message);
    } else {
      console.log(`   ✅ Step 2 updated successfully (${step2Update?.length || 0} rows)`);
    }

    // 2. Get max step_order
    console.log('\n📊 Getting max step_order...');
    const { data: maxStep, error: maxError } = await supabase
      .from('guide_onboarding_steps')
      .select('step_order')
      .is('branch_id', null)
      .order('step_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxError) {
      console.error('   ❌ Error getting max step_order:', maxError.message);
      return;
    }

    const maxOrder = maxStep?.step_order || 0;
    console.log(`   ✅ Max step_order: ${maxOrder}`);

    // 3. Check if Guide License step already exists
    console.log('\n🔍 Checking if Guide License step exists...');
    const { data: existingLicenseStep, error: checkError } = await supabase
      .from('guide_onboarding_steps')
      .select('id, step_order, title')
      .is('branch_id', null)
      .ilike('title', '%Guide License%')
      .maybeSingle();

    if (checkError) {
      console.error('   ❌ Error checking existing step:', checkError.message);
      return;
    }

    if (existingLicenseStep) {
      console.log(`   ℹ️  Guide License step already exists at order ${existingLicenseStep.step_order}`);
    } else {
      // 4. Insert Guide License step
      console.log('\n➕ Inserting Guide License step...');
      const { data: newStep, error: insertError } = await supabase
        .from('guide_onboarding_steps')
        .insert({
          branch_id: null,
          step_order: maxOrder + 1,
          step_type: 'profile_setup',
          title: 'Apply Guide License',
          description: 'Dapatkan AeroTravel Guide License (ATGL)',
          instructions: 'Setelah menyelesaikan semua langkah onboarding, Anda dapat mengajukan Guide License. Pastikan semua persyaratan sudah terpenuhi: Profil lengkap, Kontrak ditandatangani, Dokumen terupload, Training selesai, dan Assessment selesai.',
          is_required: true,
          estimated_minutes: 10,
          resource_type: 'link',
          resource_url: '/guide/id-card',
          validation_type: 'auto',
        })
        .select()
        .single();

      if (insertError) {
        console.error('   ❌ Error inserting Guide License step:', insertError.message);
      } else {
        console.log(`   ✅ Guide License step inserted successfully (order: ${newStep.step_order})`);
      }
    }

    // 5. Verify changes
    console.log('\n🔍 Verifying changes...\n');

    const { data: step2, error: verify2Error } = await supabase
      .from('guide_onboarding_steps')
      .select('title, description, instructions, resource_url')
      .eq('step_order', 2)
      .is('branch_id', null)
      .maybeSingle();

    if (!verify2Error && step2) {
      console.log('   ✅ Step 2 (Upload Dokumen):');
      console.log(`      Title: ${step2.title}`);
      console.log(`      Description: ${step2.description?.substring(0, 60)}...`);
      console.log(`      Resource URL: ${step2.resource_url}`);
    }

    const { data: licenseStep, error: verifyLicenseError } = await supabase
      .from('guide_onboarding_steps')
      .select('step_order, title, description, resource_url')
      .ilike('title', '%Guide License%')
      .is('branch_id', null)
      .maybeSingle();

    if (!verifyLicenseError && licenseStep) {
      console.log('\n   ✅ Guide License step:');
      console.log(`      Step Order: ${licenseStep.step_order}`);
      console.log(`      Title: ${licenseStep.title}`);
      console.log(`      Resource URL: ${licenseStep.resource_url}`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Step 2 updated with Guide License-specific instructions');
    console.log('   ✅ Guide License step added to onboarding flow');
    console.log('\n💡 Next steps:');
    console.log('   1. Test onboarding flow in the app');
    console.log('   2. Verify completion screen shows Guide License CTA');
    console.log('   3. Check step navigation works correctly');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
