/**
 * API: Partner Company Profile
 * GET /api/partner/profile - Get company profile
 * PUT /api/partner/profile - Update company profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
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

  try {
    const client = supabase as unknown as any;

    // Get user profile
    const { data: profile, error: profileError } = await client
      .from('users')
      .select(
        'id, company_name, company_address, npwp, phone, siup_number, siup_document_url, bank_name, bank_account_number, bank_account_name, partner_tier'
      )
      .eq('id', user.id)
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

    // Get legal documents
    const { data: documents, error: documentsError } = await client
      .from('partner_legal_documents')
      .select('*')
      .eq('partner_id', user.id)
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

  try {
    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    const client = supabase as unknown as any;

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (validated.companyName !== undefined) updateData.company_name = validated.companyName;
    if (validated.companyAddress !== undefined) updateData.company_address = validated.companyAddress;
    if (validated.npwp !== undefined) updateData.npwp = validated.npwp;
    if (validated.phone !== undefined) updateData.phone = validated.phone;
    if (validated.siupNumber !== undefined) updateData.siup_number = validated.siupNumber;
    if (validated.bankName !== undefined) updateData.bank_name = validated.bankName;
    if (validated.bankAccountNumber !== undefined) updateData.bank_account_number = validated.bankAccountNumber;
    if (validated.bankAccountName !== undefined) updateData.bank_account_name = validated.bankAccountName;

    updateData.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await client
      .from('users')
      .update(updateData)
      .eq('id', user.id)
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

