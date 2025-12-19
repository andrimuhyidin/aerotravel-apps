#!/usr/bin/env node

/**
 * Script to create sample guide contracts
 * Run: node scripts/create-sample-contracts.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env.local');
let envVars = {};
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      envVars[key] = value;
    }
  });
} catch (error) {
  console.error('⚠️  Could not read .env.local, using process.env');
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSampleContracts() {
  try {
    console.log('📋 Creating sample guide contracts...\n');

    // Get first branch
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id')
      .limit(1);

    if (branchError || !branches || branches.length === 0) {
      console.error('❌ No branch found. Please create a branch first.');
      process.exit(1);
    }

    const branchId = branches[0].id;
    console.log(`✅ Using branch: ${branchId}`);

    // Get guide user
    const { data: guides, error: guideError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('role', 'guide')
      .limit(1);

    if (guideError || !guides || guides.length === 0) {
      console.error('❌ No guide user found. Please create a guide user first.');
      process.exit(1);
    }

    const guideId = guides[0].id;
    console.log(`✅ Using guide: ${guides[0].full_name || guides[0].email} (${guideId})`);

    // Get admin user
    const { data: admins, error: adminError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('role', ['super_admin', 'ops_admin', 'finance_manager'])
      .limit(1);

    let adminId = guideId; // Fallback to guide if no admin
    if (!adminError && admins && admins.length > 0) {
      adminId = admins[0].id;
      console.log(`✅ Using admin: ${admins[0].full_name || admins[0].email} (${adminId})`);
    } else {
      console.log(`⚠️  No admin found, using guide as creator`);
    }

    // Generate contract numbers
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const contractNumber1 = `CT-${dateStr}-001`;
    const contractNumber2 = `CT-${dateStr}-002`;
    const contractNumber3 = `CT-${dateStr}-003`;

    // Calculate dates
    const startDate1 = new Date();
    const endDate1 = new Date(startDate1);
    endDate1.setFullYear(endDate1.getFullYear() + 1);

    const startDate2 = new Date(startDate1);
    startDate2.setDate(startDate2.getDate() - 30);
    const endDate2 = new Date(startDate2);
    endDate2.setFullYear(endDate2.getFullYear() + 1);

    const startDate3 = new Date(startDate1);
    startDate3.setDate(startDate3.getDate() + 10);
    const endDate3 = new Date(startDate3);
    endDate3.setFullYear(endDate3.getFullYear() + 1);

    // Import contract template
    const { generateDefaultContractContent, formatContractContentForDisplay } = await import('../lib/guide/contract-template.ts');
    const { COMPANY_CONFIG } = await import('../lib/config/company.ts');

    // Generate contract content for contract 1
    const contractContent1 = generateDefaultContractContent(
      COMPANY_CONFIG.name,
      guides[0].full_name || 'Guide',
      contractNumber1,
      startDate1.toISOString().split('T')[0],
      endDate1.toISOString().split('T')[0]
    );
    const fullContent1 = formatContractContentForDisplay(contractContent1);

    // Contract 1: Pending Signature
    const { data: contract1, error: error1 } = await supabase
      .from('guide_contracts')
      .insert({
        branch_id: branchId,
        guide_id: guideId,
        contract_number: contractNumber1,
        contract_type: 'annual',
        title: `Kontrak Kerja Tahunan ${today.getFullYear()}`,
        description: 'Kontrak kerja tahunan (master contract) yang berlaku untuk semua trip dalam periode 1 tahun. Fee ditentukan per trip assignment.',
        start_date: startDate1.toISOString().split('T')[0],
        end_date: endDate1.toISOString().split('T')[0],
        fee_amount: null,
        fee_type: 'per_trip',
        payment_terms: 'Dibayar setelah trip selesai berdasarkan fee di trip assignment',
        status: 'pending_signature',
        is_master_contract: true,
        auto_cover_trips: true,
        renewal_date: endDate1.toISOString().split('T')[0],
        created_by: adminId,
        terms_and_conditions: {
          fullContent: fullContent1,
          structuredContent: contractContent1,
          employment_type: 'freelancer',
          fee_structure: 'per_trip_assignment',
        },
      })
      .select()
      .single();

    if (error1) {
      console.error('❌ Error creating contract 1:', error1.message);
    } else {
      console.log(`✅ Created contract 1: ${contractNumber1} (Pending Signature)`);
    }

    // Contract 2: Active
    const contractContent2 = generateDefaultContractContent(
      COMPANY_CONFIG.name,
      guides[0].full_name || 'Guide',
      contractNumber2,
      startDate2.toISOString().split('T')[0],
      endDate2.toISOString().split('T')[0]
    );
    const fullContent2 = formatContractContentForDisplay(contractContent2);

    const signedDate2 = new Date(startDate2);
    signedDate2.setDate(signedDate2.getDate() + 5);

    const { data: contract2, error: error2 } = await supabase
      .from('guide_contracts')
      .insert({
        branch_id: branchId,
        guide_id: guideId,
        contract_number: contractNumber2,
        contract_type: 'annual',
        title: `Kontrak Kerja Tahunan ${startDate2.getFullYear()}`,
        description: 'Kontrak kerja tahunan (master contract) yang aktif. Fee ditentukan per trip assignment di trip_guides.',
        start_date: startDate2.toISOString().split('T')[0],
        end_date: endDate2.toISOString().split('T')[0],
        fee_amount: null,
        fee_type: 'per_trip',
        payment_terms: 'Dibayar setelah trip selesai berdasarkan fee di trip assignment',
        status: 'active',
        guide_signed_at: signedDate2.toISOString(),
        company_signed_at: signedDate2.toISOString(),
        guide_signature_url: 'typed:Guide Signature',
        company_signature_url: 'typed:Company Signature',
        is_master_contract: true,
        auto_cover_trips: true,
        renewal_date: endDate2.toISOString().split('T')[0],
        created_by: adminId,
        terms_and_conditions: {
          fullContent: fullContent2,
          structuredContent: contractContent2,
          employment_type: 'freelancer',
          fee_structure: 'per_trip_assignment',
        },
      })
      .select()
      .single();

    if (error2) {
      console.error('❌ Error creating contract 2:', error2.message);
    } else {
      console.log(`✅ Created contract 2: ${contractNumber2} (Active)`);
    }

    // Contract 3: Pending Company
    const contractContent3 = generateDefaultContractContent(
      COMPANY_CONFIG.name,
      guides[0].full_name || 'Guide',
      contractNumber3,
      startDate3.toISOString().split('T')[0],
      endDate3.toISOString().split('T')[0]
    );
    const fullContent3 = formatContractContentForDisplay(contractContent3);

    const signedDate3 = new Date();
    signedDate3.setDate(signedDate3.getDate() - 2);

    const { data: contract3, error: error3 } = await supabase
      .from('guide_contracts')
      .insert({
        branch_id: branchId,
        guide_id: guideId,
        contract_number: contractNumber3,
        contract_type: 'annual',
        title: `Kontrak Kerja Tahunan ${startDate3.getFullYear()}`,
        description: 'Kontrak kerja tahunan (master contract) menunggu tanda tangan company. Fee ditentukan per trip assignment.',
        start_date: startDate3.toISOString().split('T')[0],
        end_date: endDate3.toISOString().split('T')[0],
        fee_amount: null,
        fee_type: 'per_trip',
        payment_terms: 'Dibayar setelah trip selesai berdasarkan fee di trip assignment',
        status: 'pending_company',
        guide_signed_at: signedDate3.toISOString(),
        guide_signature_url: 'typed:Guide Signature',
        is_master_contract: true,
        auto_cover_trips: true,
        renewal_date: endDate3.toISOString().split('T')[0],
        created_by: adminId,
        terms_and_conditions: {
          fullContent: fullContent3,
          structuredContent: contractContent3,
          employment_type: 'freelancer',
          fee_structure: 'per_trip_assignment',
        },
      })
      .select()
      .single();

    if (error3) {
      console.error('❌ Error creating contract 3:', error3.message);
    } else {
      console.log(`✅ Created contract 3: ${contractNumber3} (Pending Company)`);
    }

    console.log('\n✅ Sample contracts created successfully!');
    console.log('\n📋 Summary:');
    if (contract1) console.log(`   - ${contract1.contract_number}: ${contract1.status} (ID: ${contract1.id})`);
    if (contract2) console.log(`   - ${contract2.contract_number}: ${contract2.status} (ID: ${contract2.id})`);
    if (contract3) console.log(`   - ${contract3.contract_number}: ${contract3.status} (ID: ${contract3.id})`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

createSampleContracts();
