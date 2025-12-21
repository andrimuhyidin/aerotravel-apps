/**
 * API: Company Sign Contract
 * POST /api/admin/guide/contracts/[id]/sign - Company signs contract
 */

import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { COMPANY_CONFIG } from '@/lib/config/company';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const signSchema = z.object({
  signature_data: z.string().min(1).optional(),
  signature_method: z.enum(['draw', 'upload', 'typed']).optional().default('typed'),
});

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const resolvedParams = await context.params;
  const { id: contractId } = resolvedParams;
  const supabase = await createClient();

  // Check admin role
  const isAuthorized = await hasRole([
    'super_admin',
    'ops_admin',
    'finance_manager',
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = signSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get contract
  const { data: contract, error: contractError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .select('*')
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  // Validate status
  if (contract.status !== 'pending_company') {
    return NextResponse.json(
      { error: `Contract tidak dapat ditandatangani. Status: ${contract.status}` },
      { status: 400 }
    );
  }

  // Upload signature if provided
  let signatureUrl: string | null = null;
  if (body.signature_data) {
    try {
      if (body.signature_method === 'upload' || body.signature_method === 'draw') {
        const base64Data = body.signature_data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Ensure bucket exists
        const { ensureBucketExists } = await import('@/lib/storage/ensure-bucket');
        await ensureBucketExists('guide-documents');

        const fileName = `contracts/${contractId}/company-signature-${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('guide-documents')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: false,
          });

        if (uploadError) {
          logger.warn('Storage upload failed, using typed signature', {
            error: uploadError,
            contractId,
          });
          // Fallback to typed
          const { data: adminProfile } = await client
            .from('users')
            .select('full_name')
            .eq('id', user.id)
            .single();
          signatureUrl = `typed:${adminProfile?.full_name || 'Company'}`;
        } else {
          const { data: urlData } = supabase.storage
            .from('guide-documents')
            .getPublicUrl(fileName);

          signatureUrl = urlData.publicUrl;
        }
      } else {
        signatureUrl = `typed:${body.signature_data}`;
      }
    } catch (error) {
      logger.error('Failed to upload signature', error, { contractId });
      // Fallback to typed signature
      const { data: adminProfile } = await client
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();
      signatureUrl = `typed:${adminProfile?.full_name || 'Company'}`;
    }
  } else {
    // Default: typed signature with admin name
    const { data: adminProfile } = await client
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    signatureUrl = `typed:${adminProfile?.full_name || 'Company'}`;
  }

  // Update contract
  const now = new Date().toISOString();
  const { data: updatedContract, error: updateError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .update({
      status: 'active',
      company_signed_at: now,
      company_signature_url: signatureUrl,
      updated_at: now,
    })
    .eq('id', contractId)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to sign contract', updateError, { contractId });
    return NextResponse.json({ error: 'Gagal menandatangani kontrak' }, { status: 500 });
  }

  // Create wallet transaction if contract is active AND not a master contract
  // Master contracts don't have fee_amount (fee is in trip_guides)
  const isMasterContract = contract.is_master_contract === true;
  const hasFeeAmount = contract.fee_amount && Number(contract.fee_amount) > 0;

  if (updatedContract.status === 'active' && !isMasterContract && hasFeeAmount) {
    try {
      // Get or create wallet
      const { data: wallet } = await client
        .from('guide_wallets')
        .select('id, balance')
        .eq('guide_id', contract.guide_id)
        .maybeSingle();

      let walletId: string;
      if (!wallet) {
        const { data: newWallet, error: walletError } = await client
          .from('guide_wallets')
          .insert({ guide_id: contract.guide_id, balance: 0 })
          .select('id')
          .single();

        if (walletError) throw walletError;
        walletId = newWallet.id;
      } else {
        walletId = wallet.id;
      }

      // Create earning transaction (only for non-master contracts)
      const balanceBefore = Number(wallet?.balance || 0);
      const balanceAfter = balanceBefore + Number(contract.fee_amount);

      await client.from('guide_wallet_transactions').insert({
        wallet_id: walletId,
        transaction_type: 'earning',
        amount: contract.fee_amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference_type: 'contract',
        reference_id: contractId,
        description: `Kontrak ${contract.contract_number || contractId}`,
        created_by: user.id,
      });

      // Link to contract_payments
      await client.from('guide_contract_payments').insert({
        contract_id: contractId,
        amount: contract.fee_amount,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'wallet',
        notes: 'Auto-created from contract activation',
      });

      logger.info('Wallet transaction created for contract', {
        contractId,
        walletId,
        amount: contract.fee_amount,
      });
    } catch (error) {
      logger.error('Failed to create wallet transaction', error, { contractId });
      // Don't fail the request, just log the error
    }
  } else if (isMasterContract) {
    logger.info('Master contract activated - no wallet transaction (fee per trip assignment)', {
      contractId,
      guideId: contract.guide_id,
    });
  }

  logger.info('Contract signed by company', {
    contractId,
    adminId: user.id,
    signatureMethod: body.signature_method,
  });

  // Generate signed PDF and store URL
  try {
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const contractModule = await import('@/lib/pdf/contract');
    const { ContractPDF } = contractModule;
     
    type ContractData = Parameters<typeof ContractPDF>[0]['data'];

    // Get full contract data with guide info
    const { data: fullContract } = await withBranchFilter(
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
      .single();

    if (fullContract) {
      // Prepare contract data for PDF
      const contractData: ContractData = {
        contractNumber: fullContract.contract_number || contractId,
        contractType: fullContract.contract_type,
        title: fullContract.title,
        description: fullContract.description || undefined,
        startDate: fullContract.start_date,
        endDate: fullContract.end_date || undefined,
        feeAmount: Number(fullContract.fee_amount || 0),
        feeType: fullContract.fee_type || 'fixed',
        paymentTerms: fullContract.payment_terms || undefined,
        termsAndConditions: (fullContract.terms_and_conditions as Record<string, unknown>) || {},
        companyName: COMPANY_CONFIG.name,
        companyAddress: COMPANY_CONFIG.address,
        companyPhone: COMPANY_CONFIG.phone,
        companyEmail: COMPANY_CONFIG.email,
        guideName: (fullContract.guide as { full_name?: string })?.full_name || 'Guide',
        guideAddress: (fullContract.guide as { address?: string })?.address || undefined,
        guidePhone: (fullContract.guide as { phone?: string })?.phone || undefined,
        guideEmail: (fullContract.guide as { email?: string })?.email || undefined,
        guideSignatureUrl: fullContract.guide_signature_url || undefined,
        companySignatureUrl: fullContract.company_signature_url || undefined,
        guideSignedAt: fullContract.guide_signed_at || undefined,
        companySignedAt: fullContract.company_signed_at || undefined,
      };

      // Generate PDF
      const pdfBuffer = await renderToBuffer(React.createElement(ContractPDF, { data: contractData }) as any);

      // Ensure bucket exists
      const { ensureBucketExists } = await import('@/lib/storage/ensure-bucket');
      await ensureBucketExists('guide-documents');

      // Upload to storage
      const fileName = `contracts/${contractId}/signed-contract-${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('guide-documents')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (!uploadError && uploadData) {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('guide-documents')
          .getPublicUrl(fileName);

        // Update contract with signed PDF URL
        await withBranchFilter(
          client.from('guide_contracts'),
          branchContext,
        )
          .update({ signed_pdf_url: urlData.publicUrl })
          .eq('id', contractId);

        logger.info('Signed PDF generated and stored', {
          contractId,
          pdfUrl: urlData.publicUrl,
        });
      } else {
        logger.warn('Failed to upload signed PDF', { contractId, error: uploadError });
      }
    }
  } catch (error) {
    logger.error('Failed to generate signed PDF', error, { contractId });
    // Don't fail the request if PDF generation fails
  }

  // Send notifications
  try {
    const { notifyGuideContractActive, createInAppNotification } = await import('@/lib/integrations/contract-notifications');
    
    // Get guide info
    const { data: guide } = await client
      .from('users')
      .select('phone, full_name')
      .eq('id', contract.guide_id)
      .single();

    // WhatsApp notification
    if (guide?.phone) {
      await notifyGuideContractActive(
        guide.phone,
        contract.contract_number || contractId,
        Number(contract.fee_amount || 0)
      );
    }

    // In-app notification
    await createInAppNotification(
      contract.guide_id,
      'contract_active',
      'Kontrak Aktif',
      `Kontrak ${contract.contract_number || contractId} telah aktif. Fee telah ditambahkan ke wallet Anda.`,
      contractId
    );
  } catch (error) {
    logger.error('Failed to send notifications', error, { contractId });
    // Don't fail the request if notification fails
  }

  return NextResponse.json({
    success: true,
    contract: updatedContract,
    message: 'Kontrak telah ditandatangani dan aktif',
  });
});
