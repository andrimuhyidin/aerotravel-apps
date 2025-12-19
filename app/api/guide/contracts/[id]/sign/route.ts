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
  
  logger.info('Contract sign request', { contractId });
  
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logger.warn('Unauthorized contract sign attempt', { contractId });
    return NextResponse.json(
      { 
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        statusCode: 401 
      },
      { status: 401 }
    );
  }

  let body;
  try {
    body = signSchema.parse(await request.json());
  } catch (error) {
    logger.error('Invalid request body', error, { contractId, guideId: user.id });
    return NextResponse.json(
      { 
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body. Signature data is required.',
        statusCode: 400 
      },
      { status: 400 }
    );
  }

  let branchContext;
  try {
    branchContext = await getBranchContext(user.id);
  } catch (error) {
    logger.error('Failed to get branch context', error, { contractId, guideId: user.id });
    return NextResponse.json(
      { 
        code: 'BRANCH_ERROR',
        message: 'Failed to get branch context',
        statusCode: 500 
      },
      { status: 500 }
    );
  }
  
  const client = supabase as unknown as any;

  // Get contract
  let contract;
  let contractError;
  try {
    const result = await withBranchFilter(
      client.from('guide_contracts'),
      branchContext,
    )
      .select('*')
      .eq('id', contractId)
      .eq('guide_id', user.id)
      .single();
    contract = result.data;
    contractError = result.error;
  } catch (error) {
    logger.error('Failed to query contract', error, { contractId, guideId: user.id });
    return NextResponse.json(
      { 
        code: 'DATABASE_ERROR',
        message: 'Gagal memuat data kontrak',
        statusCode: 500 
      },
      { status: 500 }
    );
  }

  if (contractError || !contract) {
    logger.error('Contract not found', contractError, { contractId, guideId: user.id });
    return NextResponse.json(
      { 
        code: 'NOT_FOUND',
        message: 'Contract not found',
        statusCode: 404 
      },
      { status: 404 }
    );
  }

  // Validate status
  if (contract.status !== 'pending_signature') {
    logger.warn('Contract cannot be signed - invalid status', {
      contractId,
      currentStatus: contract.status,
      guideId: user.id,
    });
    return NextResponse.json(
      { 
        code: 'INVALID_STATUS',
        message: `Contract tidak dapat ditandatangani. Status: ${contract.status}`,
        statusCode: 400 
      },
      { status: 400 }
    );
  }

  // Upload signature to storage
  let signatureUrl: string | null = null;
  try {
    if (body.signature_method === 'upload' || body.signature_method === 'draw') {
      // Convert base64 to buffer
      let base64Data: string;
      try {
        base64Data = body.signature_data.replace(/^data:image\/\w+;base64,/, '');
      } catch (error) {
        logger.error('Invalid base64 signature data', error, { contractId, guideId: user.id });
        throw new Error('Invalid signature data format');
      }

      let buffer: Buffer;
      try {
        buffer = Buffer.from(base64Data, 'base64');
      } catch (error) {
        logger.error('Failed to convert base64 to buffer', error, { contractId, guideId: user.id });
        throw new Error('Failed to process signature image');
      }

      // Ensure bucket exists
      try {
        const { ensureBucketExists } = await import('@/lib/storage/ensure-bucket');
        await ensureBucketExists('guide-documents');
      } catch (error) {
        logger.warn('Failed to ensure bucket exists, continuing with fallback', {
          error,
          contractId,
          guideId: user.id,
        });
      }

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
          guideId: user.id,
        });
        const { data: guideProfile } = await client
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        signatureUrl = `typed:${guideProfile?.full_name || 'Guide'}`;
      } else if (uploadData?.path) {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('guide-documents')
          .getPublicUrl(uploadData.path);

        signatureUrl = urlData.publicUrl;
      } else {
        // Fallback if uploadData is null
        logger.warn('Upload data is null, using typed signature as fallback', {
          contractId,
          guideId: user.id,
        });
        const { data: guideProfile } = await client
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        signatureUrl = `typed:${guideProfile?.full_name || 'Guide'}`;
      }
    } else {
      // Typed signature - store as text
      const { data: guideProfile } = await client
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      signatureUrl = `typed:${body.signature_data || guideProfile?.full_name || 'Guide'}`;
    }
  } catch (error) {
    logger.error('Failed to process signature', error, { contractId, guideId: user.id });
    // Fallback to typed signature
    try {
      const { data: guideProfile } = await client
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      signatureUrl = `typed:${guideProfile?.full_name || 'Guide'}`;
    } catch (fallbackError) {
      logger.error('Failed to get guide profile for fallback', fallbackError, {
        contractId,
        guideId: user.id,
      });
      signatureUrl = `typed:Guide`;
    }
  }

  if (!signatureUrl) {
    logger.error('Signature URL is null after processing', { contractId, guideId: user.id });
    return NextResponse.json(
      { 
        code: 'SIGNATURE_PROCESSING_FAILED',
        message: 'Gagal memproses tanda tangan',
        statusCode: 500 
      },
      { status: 500 }
    );
  }

  // Update contract
  const now = new Date().toISOString();
  const newStatus = contract.company_signed_at ? 'active' : 'pending_company';

  let updatedContract;
  let updateError;
  try {
    const result = await withBranchFilter(
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
    updatedContract = result.data;
    updateError = result.error;
  } catch (error) {
    logger.error('Failed to update contract - exception', error, { contractId, guideId: user.id });
    return NextResponse.json(
      { 
        code: 'UPDATE_FAILED',
        message: 'Gagal memperbarui kontrak',
        statusCode: 500 
      },
      { status: 500 }
    );
  }

  if (updateError) {
    logger.error('Failed to update contract', updateError, { contractId, guideId: user.id });
    return NextResponse.json(
      { 
        code: 'UPDATE_FAILED',
        message: 'Gagal memperbarui kontrak',
        statusCode: 500 
      },
      { status: 500 }
    );
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

  // Send notifications (non-blocking)
  try {
    const { notifyAdminContractSigned, createInAppNotification } = await import('@/lib/integrations/contract-notifications');
    
    // Notify admin (get admin phone from created_by or default)
    const { data: adminUser } = await client
      .from('users')
      .select('phone, full_name')
      .eq('id', contract.created_by)
      .maybeSingle();

    if (adminUser?.phone) {
      try {
        await notifyAdminContractSigned(
          adminUser.phone,
          contract.contract_number || contractId,
          user.email?.split('@')[0] || 'Guide'
        );
      } catch (notifError) {
        logger.error('Failed to send WhatsApp notification', notifError, {
          contractId,
          adminPhone: adminUser.phone,
        });
      }
    }

    // In-app notification for admin
    if (contract.created_by) {
      try {
        await createInAppNotification(
          contract.created_by,
          'contract_signed',
          'Kontrak Ditandatangani Guide',
          `Guide telah menandatangani kontrak ${contract.contract_number || contractId}. Silakan tandatangani sebagai perusahaan.`,
          contractId
        );
      } catch (notifError) {
        logger.error('Failed to create in-app notification', notifError, {
          contractId,
          adminId: contract.created_by,
        });
      }
    }
  } catch (error) {
    logger.error('Failed to send notifications', error, { contractId, guideId: user.id });
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
