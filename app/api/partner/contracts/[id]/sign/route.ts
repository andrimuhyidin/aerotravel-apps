/**
 * API: Sign Partner Contract
 * POST /api/partner/contracts/:id/sign - Sign a contract
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const signSchema = z.object({
  signature: z.string().min(1, 'Signature is required'),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional().nullable(),
  agreedToTerms: z.boolean(),
  signedAt: z.string(),
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const body = await request.json();
  const validation = signSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  const { signature, location, signedAt } = validation.data;

  try {
    // Verify contract exists and is pending
    const { data: contract, error: contractError } = await client
      .from('partner_contracts')
      .select('id, status')
      .eq('id', id)
      .eq('partner_id', partnerId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    if (contract.status !== 'pending') {
      return NextResponse.json(
        { error: 'Contract is not pending signature' },
        { status: 400 }
      );
    }

    // Get user info for IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Update contract with signature
    const { error: updateError } = await client
      .from('partner_contracts')
      .update({
        status: 'signed',
        signed_at: signedAt,
        signature_data: signature,
        signature_location: location ? `${location.lat},${location.lng}` : null,
        signature_ip: ipAddress,
        signature_user_agent: userAgent,
      })
      .eq('id', id);

    if (updateError) {
      logger.error('Failed to update contract', updateError, { userId: user.id, contractId: id });
      throw updateError;
    }

    // Log the signature event
    logger.info('Contract signed', {
      userId: user.id,
      contractId: id,
      location,
      ipAddress,
    });

    // Send confirmation email (non-blocking)
    try {
      const { sendEmail } = await import('@/lib/integrations/resend');
      const { data: userProfile } = await client
        .from('users')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      if (userProfile?.email) {
        await sendEmail({
          to: userProfile.email,
          subject: '✅ Kontrak Berhasil Ditandatangani',
          html: `
            <h2>Kontrak Telah Ditandatangani</h2>
            <p>Halo ${userProfile.full_name},</p>
            <p>Kontrak Anda telah berhasil ditandatangani pada ${new Date(signedAt).toLocaleString('id-ID')}.</p>
            <p>Detail:</p>
            <ul>
              <li>ID Kontrak: ${id}</li>
              <li>Waktu: ${new Date(signedAt).toLocaleString('id-ID')}</li>
              ${location ? `<li>Lokasi: ${location.lat}, ${location.lng}</li>` : ''}
            </ul>
            <p>Simpan email ini sebagai bukti tanda tangan digital Anda.</p>
          `,
        });
      }
    } catch (emailError) {
      logger.warn('Failed to send signature confirmation email', {
        contractId: id,
        error: emailError instanceof Error ? emailError.message : String(emailError),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to sign contract', error, { userId: user.id, contractId: id });
    throw error;
  }
});

