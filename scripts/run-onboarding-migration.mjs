import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('🚀 Running Onboarding Guide License Migration...\n');
  
  // Update Step 2
  console.log('📝 Updating Step 2: Upload Dokumen...');
  const { data: step2, error: e2 } = await supabase
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
  
  if (e2) {
    console.error('❌ Step 2 error:', e2.message);
  } else {
    console.log(`✅ Step 2 updated: ${step2?.length || 0} row(s)`);
  }
  
  // Get max order
  const { data: max } = await supabase
    .from('guide_onboarding_steps')
    .select('step_order')
    .is('branch_id', null)
    .order('step_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  const maxOrder = max?.step_order || 0;
  console.log(`📊 Max step_order: ${maxOrder}`);
  
  // Check if Guide License step exists
  const { data: existing } = await supabase
    .from('guide_onboarding_steps')
    .select('id, step_order')
    .is('branch_id', null)
    .ilike('title', '%Guide License%')
    .maybeSingle();
  
  if (existing) {
    console.log(`ℹ️  Guide License step already exists at order ${existing.step_order}`);
  } else {
    console.log('➕ Inserting Guide License step...');
    const { data: newStep, error: e3 } = await supabase
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
    
    if (e3) {
      console.error('❌ Insert error:', e3.message);
    } else {
      console.log(`✅ Guide License step inserted (order: ${newStep?.step_order})`);
    }
  }
  
  // Verify
  console.log('\n🔍 Verifying changes...');
  const { data: verify2 } = await supabase
    .from('guide_onboarding_steps')
    .select('title, description, resource_url')
    .eq('step_order', 2)
    .is('branch_id', null)
    .maybeSingle();
  
  if (verify2) {
    console.log('✅ Step 2:', verify2.title);
    console.log('   Description:', verify2.description?.substring(0, 50) + '...');
  }
  
  const { data: verifyLicense } = await supabase
    .from('guide_onboarding_steps')
    .select('step_order, title, resource_url')
    .ilike('title', '%Guide License%')
    .is('branch_id', null)
    .maybeSingle();
  
  if (verifyLicense) {
    console.log(`✅ Guide License step: Order ${verifyLicense.step_order}, Title: ${verifyLicense.title}`);
  }
  
  console.log('\n🎉 Migration completed successfully!');
}

run().catch(console.error);
