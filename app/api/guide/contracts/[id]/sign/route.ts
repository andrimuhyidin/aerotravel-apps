/**
 * API: Sign Contract
 * POST /api/guide/contracts/[id]/sign - Guide signs contract
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const signSchema = z.object({
  signature_data: z.string().min(1), // Base64 signature image atau signature coordinates
  signature_method: z.enum(['draw', 'upload', 'typed']).optional().default('draw'),
});

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const resolvedParams = await context.params;
  const { id: contractId } = resolvedParams;
  const supabase = await createClient();

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
    .eq('guide_id', user.id)
    .single();

  if (contractError || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  // Validate status
  if (contract.status !== 'pending_signature') {
    return NextResponse.json(
      { error: `Contract tidak dapat ditandatangani. Status: ${contract.status}` },
      { status: 400 }
    );
  }

  // Upload signature to storage
  let signatureUrl: string | null = null;
  try {
    if (body.signature_method === 'upload' || body.signature_method === 'draw') {
      // Convert base64 to buffer
      const base64Data = body.signature_data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Ensure bucket exists
      const { ensureBucketExists } = await import('@/lib/storage/ensure-bucket');
      await ensureBucketExists('guide-documents');

      // Upload to Supabase Storage
      const fileName = `contracts/${contractId}/guide-signature-${Date.now()}.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('guide-documents')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) {
        // If bucket doesn't exist or upload fails, use typed signature as fallback
        logger.warn('Storage upload failed, using typed signature as fallback', {
          error: uploadError,
          contractId,
        });
        const { data: guideProfile } = await client
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();
        signatureUrl = `typed:${guideProfile?.full_name || 'Guide'}`;
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('guide-documents')
          .getPublicUrl(fileName);

        signatureUrl = urlData.publicUrl;
      }
    } else {
      // Typed signature - store as text
      const { data: guideProfile } = await client
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();
      signatureUrl = `typed:${body.signature_data || guideProfile?.full_name || 'Guide'}`;
    }
  } catch (error) {
    logger.error('Failed to process signature', error, { contractId });
    // Fallback to typed signature
    const { data: guideProfile } = await client
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();
    signatureUrl = `typed:${guideProfile?.full_name || 'Guide'}`;
  }

  // Update contract
  const now = new Date().toISOString();
  const newStatus = contract.company_signed_at ? 'active' : 'pending_company';

  const { data: updatedContract, error: updateError } = await withBranchFilter(
    client.from('guide_contracts'),
    branchContext,
  )
    .update({
      status: newStatus,
      guide_signed_at: now,
      guide_signature_url: signatureUrl,
      updated_at: now,
    })
    .eq('id', contractId)
    .select()
    .single();

  if (updateError) {
    logger.error('Failed to update contract', updateError, { contractId });
    return NextResponse.json({ error: 'Gagal memperbarui kontrak' }, { status: 500 });
  }

  // If both signed, PDF will be generated when company signs (handled in admin sign endpoint)
  if (newStatus === 'active' && contract.company_signed_at) {
    logger.info('Contract fully signed, PDF generation will be triggered by company sign', { contractId });
  }

  logger.info('Contract signed by guide', {
    contractId,
    guideId: user.id,
    signatureMethod: body.signature_method,
  });

  // Send notifications
  try {
    const { notifyAdminContractSigned, createInAppNotification } = await import('@/lib/integrations/contract-notifications');
    
    // Notify admin (get admin phone from created_by or default)
    const { data: adminUser } = await client
      .from('users')
      .select('phone, full_name')
      .eq('id', contract.created_by)
      .maybeSingle();

    if (adminUser?.phone) {
      await notifyAdminContractSigned(
        adminUser.phone,
        contract.contract_number || contractId,
        user.email?.split('@')[0] || 'Guide'
      );
    }

    // In-app notification for admin
    if (contract.created_by) {
      await createInAppNotification(
        contract.created_by,
        'contract_signed',
        'Kontrak Ditandatangani Guide',
        `Guide telah menandatangani kontrak ${contract.contract_number || contractId}. Silakan tandatangani sebagai perusahaan.`,
        contractId
      );
    }
  } catch (error) {
    logger.error('Failed to send notifications', error, { contractId });
    // Don't fail the request if notification fails
  }

  return NextResponse.json({
    success: true,
    contract: updatedContract,
    message: newStatus === 'active' 
      ? 'Kontrak telah ditandatangani dan aktif' 
      : 'Kontrak telah ditandatangani, menunggu tanda tangan perusahaan',
  });
});
