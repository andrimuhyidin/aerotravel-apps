/**
 * API: Partner Company Profile
 * GET /api/partner/profile - Get company profile
 * PUT /api/partner/profile - Update company profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeRequestBody, verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateProfileSchema = z.object({
  companyName: z.string().min(3).optional(),
  companyAddress: z.string().min(10).optional(),
  npwp: z.string().min(15).max(15).optional(),
  phone: z.string().min(10).optional(),
  siupNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'User is not a partner' },
      { status: 403 }
    );
  }

  try {
    const client = supabase as unknown as any;

    // Get user profile using verified partnerId
    const { data: profile, error: profileError } = await client
      .from('users')
      .select(
        'id, company_name, company_address, npwp, phone, siup_number, siup_document_url, bank_name, bank_account_number, bank_account_name, partner_tier'
      )
      .eq('id', partnerId)
      .eq('role', 'mitra')
      .single();

    if (profileError) {
      logger.error('Failed to fetch partner profile', profileError, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get legal documents using verified partnerId
    const { data: documents, error: documentsError } = await client
      .from('partner_legal_documents')
      .select('*')
      .eq('partner_id', partnerId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (documentsError) {
      logger.warn('Failed to fetch legal documents', {
        userId: user.id,
        error: documentsError instanceof Error ? documentsError.message : String(documentsError),
      });
    }

    return NextResponse.json({
      profile: {
        companyName: profile.company_name,
        companyAddress: profile.company_address,
        npwp: profile.npwp,
        phone: profile.phone,
        siupNumber: profile.siup_number,
        siupDocumentUrl: profile.siup_document_url,
        bankName: profile.bank_name,
        bankAccountNumber: profile.bank_account_number,
        bankAccountName: profile.bank_account_name,
        tier: profile.partner_tier || 'bronze',
      },
      documents: documents || [],
    });
  } catch (error) {
    logger.error('Error in GET /api/partner/profile', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'User is not a partner' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    // Sanitize validated data
    const sanitized = sanitizeRequestBody(validated, {
      strings: ['companyName', 'companyAddress', 'npwp', 'siupNumber', 'bankName', 'bankAccountNumber', 'bankAccountName'],
      phones: ['phone'],
    });

    const client = supabase as unknown as any;

    // Build update object using sanitized data
    const updateData: Record<string, unknown> = {};
    if (sanitized.companyName !== undefined) updateData.company_name = sanitized.companyName;
    if (sanitized.companyAddress !== undefined) updateData.company_address = sanitized.companyAddress;
    if (sanitized.npwp !== undefined) updateData.npwp = sanitized.npwp;
    if (sanitized.phone !== undefined) updateData.phone = sanitized.phone;
    if (sanitized.siupNumber !== undefined) updateData.siup_number = sanitized.siupNumber;
    if (sanitized.bankName !== undefined) updateData.bank_name = sanitized.bankName;
    if (sanitized.bankAccountNumber !== undefined) updateData.bank_account_number = sanitized.bankAccountNumber;
    if (sanitized.bankAccountName !== undefined) updateData.bank_account_name = sanitized.bankAccountName;

    updateData.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await client
      .from('users')
      .update(updateData)
      .eq('id', partnerId) // Use verified partnerId
      .eq('role', 'mitra')
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update partner profile', updateError, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    logger.info('Partner profile updated', { userId: user.id });

    return NextResponse.json({
      success: true,
      profile: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error in PUT /api/partner/profile', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

