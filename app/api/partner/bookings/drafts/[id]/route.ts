/**
 * API: Booking Draft by ID
 * GET /api/partner/bookings/drafts/:id - Get single draft
 * DELETE /api/partner/bookings/drafts/:id - Delete draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type Params = {
  id: string;
};

export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<Params> }) => {
    const { id: draftId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = supabase as unknown as any;

    try {
      const { data: draft, error } = await client
        .from('booking_drafts')
        .select(`
          id,
          package_id,
          trip_date,
          customer_id,
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
            duration_days,
            duration_nights,
            thumbnail_url,
            prices:package_prices(
              min_pax,
              max_pax,
              price_publish,
              price_nta
            )
          )
        `)
        .eq('id', draftId)
        .eq('partner_id', user.id)
        .single();

      if (error || !draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }

      // Check if expired
      if (new Date(draft.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Draft has expired' }, { status: 410 });
      }

      return NextResponse.json({ draft });
    } catch (error) {
      logger.error('Failed to fetch draft', error, { userId: user.id, draftId });
      throw error;
    }
  }
);

export const DELETE = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<Params> }) => {
    const { id: draftId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = supabase as unknown as any;

    try {
      const { error } = await client
        .from('booking_drafts')
        .delete()
        .eq('id', draftId)
        .eq('partner_id', user.id);

      if (error) {
        logger.error('Failed to delete draft', error, { userId: user.id, draftId });
        return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
      }

      logger.info('Draft deleted', { userId: user.id, draftId });

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error('Failed to delete draft', error, { userId: user.id, draftId });
      throw error;
    }
  }
);

