/**
 * API: Download Contract PDF
 * GET /api/guide/contracts/[id]/pdf - Download contract PDF
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { NextRequest, NextResponse } from 'next/server';
import React from 'react';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import type { ContractData } from '@/lib/pdf/contract';
import { ContractPDF } from '@/lib/pdf/contract';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (_request: NextRequest, context: RouteContext) => {
  const resolvedParams = await context.params;
  const { id: contractId } = resolvedParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get contract with guide info
  const { data: contract, error: contractError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .select(
      `
      *,
      guide:users!guide_contracts_guide_id_fkey(
        id,
        full_name,
        email,
        phone,
        address
      )
    `
    )
    .eq('id', contractId)
    .eq('guide_id', user.id)
    .single();

  if (contractError || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  // Get company info
  const { getCompanyConfig } = await import('@/lib/config/company');
  const companyConfig = await getCompanyConfig();
  const companyName = companyConfig.name;
  const companyAddress = companyConfig.address;
  const companyPhone = companyConfig.phone;
  const companyEmail = companyConfig.email;

  // Prepare contract data for PDF
  const contractData: ContractData = {
    contractNumber: contract.contract_number || contractId,
    contractType: contract.contract_type,
    title: contract.title,
    description: contract.description || undefined,
    startDate: contract.start_date,
    endDate: contract.end_date || undefined,
    feeAmount: Number(contract.fee_amount || 0),
    feeType: contract.fee_type || 'fixed',
    paymentTerms: contract.payment_terms || undefined,
    termsAndConditions: (contract.terms_and_conditions as Record<string, unknown>) || {},
    companyName,
    companyAddress,
    companyPhone,
    companyEmail,
    guideName: (contract.guide as { full_name?: string })?.full_name || 'Guide',
    guideAddress: (contract.guide as { address?: string })?.address || undefined,
    guidePhone: (contract.guide as { phone?: string })?.phone || undefined,
    guideEmail: (contract.guide as { email?: string })?.email || undefined,
    guideSignatureUrl: contract.guide_signature_url || undefined,
    companySignatureUrl: contract.company_signature_url || undefined,
    guideSignedAt: contract.guide_signed_at || undefined,
    companySignedAt: contract.company_signed_at || undefined,
  };

  try {
    // Generate PDF
    const pdfBuffer = await renderToBuffer(React.createElement(ContractPDF, { data: contractData }) as any);

    logger.info('Contract PDF generated', { contractId });

    // Return PDF
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contract-${contract.contract_number || contractId}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('Failed to generate contract PDF', error, { contractId });
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
});
