/**
 * API: Create Sample Contracts
 * POST /api/admin/guide/contracts/create-sample - Create sample contracts for current guide
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { COMPANY_CONFIG } from '@/lib/config/company';
import { formatContractContentForDisplay, generateDefaultContractContent } from '@/lib/guide/contract-template';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is guide or admin
  const { data: userProfile } = await supabase
    .from('users')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single();

  if (!userProfile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  // Use guide_id from query params or use current user if they are a guide
  const { searchParams } = new URL(request.url);
  const targetGuideId = searchParams.get('guide_id') || (userProfile.role === 'guide' ? user.id : null);

  if (!targetGuideId) {
    return NextResponse.json({ error: 'Guide ID is required' }, { status: 400 });
  }

  // Get guide info
  const { data: guideInfo } = await supabase
    .from('users')
    .select('id, full_name, email, phone, address')
    .eq('id', targetGuideId)
    .single();

  if (!guideInfo) {
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
  }

  const branchContext = await getBranchContext(user.id);
  let branchId = branchContext.branchId;
  
  if (!branchId) {
    const { data: branchData } = await supabase.from('branches').select('id').limit(1).maybeSingle();
    branchId = branchData?.id;
  }
  
  if (!branchId) {
    // Try to get branch from guide's profile
    const { data: guideProfile } = await supabase
      .from('users')
      .select('branch_id')
      .eq('id', targetGuideId)
      .single();
    branchId = guideProfile?.branch_id as string | undefined;
  }

  if (!branchId) {
    return NextResponse.json({ error: 'No branch found. Please ensure guide has a branch assigned.' }, { status: 400 });
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

  const contracts = [];

  try {
    // Contract 1: Pending Signature
    const contractContent1 = generateDefaultContractContent(
      COMPANY_CONFIG.name,
      guideInfo.full_name || 'Guide',
      contractNumber1,
      startDate1.toISOString().split('T')[0],
      endDate1.toISOString().split('T')[0],
      {
        address: guideInfo.address || undefined,
        phone: guideInfo.phone || undefined,
        email: guideInfo.email || undefined,
      }
    );
    const fullContent1 = formatContractContentForDisplay(contractContent1);

    const { data: contract1, error: error1 } = await supabase
      .from('guide_contracts')
      .insert({
        branch_id: branchId,
        guide_id: targetGuideId,
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
        created_by: user.id,
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
      logger.error('Error creating contract 1', error1);
    } else {
      contracts.push(contract1);
    }

    // Contract 2: Active
    const contractContent2 = generateDefaultContractContent(
      COMPANY_CONFIG.name,
      guideInfo.full_name || 'Guide',
      contractNumber2,
      startDate2.toISOString().split('T')[0],
      endDate2.toISOString().split('T')[0],
      {
        address: guideInfo.address || undefined,
        phone: guideInfo.phone || undefined,
        email: guideInfo.email || undefined,
      }
    );
    const fullContent2 = formatContractContentForDisplay(contractContent2);

    const signedDate2 = new Date(startDate2);
    signedDate2.setDate(signedDate2.getDate() + 5);

    const { data: contract2, error: error2 } = await supabase
      .from('guide_contracts')
      .insert({
        branch_id: branchId,
        guide_id: targetGuideId,
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
        created_by: user.id,
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
      logger.error('Error creating contract 2', error2);
    } else {
      contracts.push(contract2);
    }

    // Contract 3: Pending Company
    const contractContent3 = generateDefaultContractContent(
      COMPANY_CONFIG.name,
      guideInfo.full_name || 'Guide',
      contractNumber3,
      startDate3.toISOString().split('T')[0],
      endDate3.toISOString().split('T')[0],
      {
        address: guideInfo.address || undefined,
        phone: guideInfo.phone || undefined,
        email: guideInfo.email || undefined,
      }
    );
    const fullContent3 = formatContractContentForDisplay(contractContent3);

    const signedDate3 = new Date();
    signedDate3.setDate(signedDate3.getDate() - 2);

    const { data: contract3, error: error3 } = await supabase
      .from('guide_contracts')
      .insert({
        branch_id: branchId,
        guide_id: targetGuideId,
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
        created_by: user.id,
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
      logger.error('Error creating contract 3', error3);
    } else {
      contracts.push(contract3);
    }

    logger.info('Sample contracts created', {
      guideId: targetGuideId,
      count: contracts.length,
    });

    return NextResponse.json({
      success: true,
      message: `Created ${contracts.length} sample contracts`,
      contracts: contracts.map((c) => ({
        id: c.id,
        contract_number: c.contract_number,
        status: c.status,
      })),
    });
  } catch (error) {
    logger.error('Failed to create sample contracts', error);
    return NextResponse.json(
      {
        error: 'Failed to create sample contracts',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
});
