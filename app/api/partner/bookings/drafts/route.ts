/**
 * API: Booking Drafts Management
 * GET /api/partner/bookings/drafts - List partner's drafts
 * POST /api/partner/bookings/drafts - Create/Update draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

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
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  // Sanitize search params
  const searchParams = sanitizeSearchParams(request);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

  const client = supabase as unknown as any;

  try {
    // Get partner's drafts (not expired)
    const { data: drafts, error } = await client
      .from('booking_drafts')
      .select(`
        id,
        package_id,
        trip_date,
        customer_name,
        customer_phone,
        customer_email,
        adult_pax,
        child_pax,
        infant_pax,
        special_requests,
        form_data,
        expires_at,
        created_at,
        updated_at,
        package:packages(
          id,
          name,
          destination,
          thumbnail_url
        )
      `)
      .eq('partner_id', partnerId)
      .gt('expires_at', new Date().toISOString())
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch drafts', error, { userId: user.id });
      return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
    }

    return NextResponse.json({ drafts: drafts || [] });
  } catch (error) {
    logger.error('Failed to fetch drafts', error, { userId: user.id });
    throw error;
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
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
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const body = await request.json();
  
  // Sanitize input
  const sanitizedBody = sanitizeRequestBody(body, {
    strings: ['customerName', 'specialRequests'],
    emails: ['customerEmail'],
    phones: ['customerPhone'],
  });
  
  const {
    draftId,
    packageId,
    tripDate,
    customerId,
    customerName,
    customerPhone,
    customerEmail,
    adultPax,
    childPax = 0,
    infantPax = 0,
    specialRequests,
    formData, // Complete form state
  } = sanitizedBody;

  const client = supabase as unknown as any;

  try {
    // Validate minimum required fields
    if (!packageId && !formData) {
      return NextResponse.json(
        { error: 'Package ID or form data is required' },
        { status: 400 }
      );
    }

    const draftData = {
      partner_id: partnerId,
      package_id: packageId || null,
      trip_date: tripDate || null,
      customer_id: customerId || null,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      customer_email: customerEmail || null,
      adult_pax: adultPax || null,
      child_pax: childPax || 0,
      infant_pax: infantPax || 0,
      special_requests: specialRequests || null,
      form_data: formData || {},
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      updated_at: new Date().toISOString(),
    };

    let draft;

    if (draftId) {
      // Update existing draft
      const { data, error } = await client
        .from('booking_drafts')
        .update(draftData)
        .eq('id', draftId)
        .eq('partner_id', partnerId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update draft', error, { userId: user.id, draftId });
        return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
      }

      draft = data;
    } else {
      // Create new draft
      const { data, error } = await client
        .from('booking_drafts')
        .insert({
          ...draftData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create draft', error, { userId: user.id });
        return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
      }

      draft = data;
    }

    logger.info('Draft saved', { userId: user.id, draftId: draft.id });

    return NextResponse.json({ draft }, { status: draftId ? 200 : 201 });
  } catch (error) {
    logger.error('Failed to save draft', error, { userId: user.id });
    throw error;
  }
});

