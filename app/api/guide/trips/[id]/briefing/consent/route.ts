/**
 * API: Passenger Consent
 * GET /api/guide/trips/[id]/briefing/consent - Get consent status
 * POST /api/guide/trips/[id]/briefing/consent - Create/update consent
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const consentSchema = z.object({
  passenger_id: z.string().uuid(),
  consent_given: z.boolean(),
  signature: z
    .object({
      method: z.enum(['draw', 'upload', 'typed']),
      data: z.string(),
    })
    .optional(),
  briefing_acknowledged: z.boolean().default(false),
  acknowledged_points: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const GET = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const supabase = await createClient();
    const { id: tripId } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = supabase as unknown as any;

    // Get all consents for this trip
    const { data: consents, error } = await client
      .from('passenger_consents')
      .select('*')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id);

    if (error) {
      logger.error('Failed to fetch consents', error, {
        tripId,
        guideId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to fetch consents' },
        { status: 500 }
      );
    }

    // Check if all passengers consented
    const { data: allConsented } = await client.rpc(
      'all_passengers_consented',
      {
        trip_uuid: tripId,
      }
    );

    return NextResponse.json({
      consents: consents || [],
      all_consented: allConsented || false,
    });
  }
);

export const POST = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const supabase = await createClient();
    const { id: tripId } = await params;
    const payload = consentSchema.parse(await request.json());

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify guide assignment
    const client = supabase as unknown as any;
    const { data: assignment } = await client
      .from('trip_guides')
      .select('id')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .maybeSingle();

    const { data: crewAssignment } = await client
      .from('trip_crews')
      .select('id')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .maybeSingle();

    if (!assignment && !crewAssignment) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const branchContext = await getBranchContext(user.id);

    // Check if consent already exists
    const { data: existing } = await client
      .from('passenger_consents')
      .select('id')
      .eq('trip_id', tripId)
      .eq('passenger_id', payload.passenger_id)
      .maybeSingle();

    const consentData = {
      trip_id: tripId,
      passenger_id: payload.passenger_id,
      guide_id: user.id,
      branch_id: branchContext.branchId,
      consent_given: payload.consent_given,
      consent_method: payload.signature ? 'signature' : 'verbal',
      signature_data: payload.signature?.data || null,
      signature_method: payload.signature?.method || null,
      signature_timestamp: payload.signature ? new Date().toISOString() : null,
      briefing_acknowledged: payload.briefing_acknowledged,
      acknowledged_points: payload.acknowledged_points || null,
      notes: payload.notes || null,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      // Update existing
      let updateQuery = client
        .from('passenger_consents')
        .update(consentData)
        .eq('id', existing.id);

      // Apply branch filter manually
      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        updateQuery = updateQuery.eq('branch_id', branchContext.branchId);
      }

      const { data, error } = await updateQuery.select().single();

      if (error) {
        logger.error('Failed to update consent', error, {
          tripId,
          passengerId: payload.passenger_id,
        });
        return NextResponse.json(
          { error: 'Failed to update consent' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new (insert doesn't need branch filter as branch_id is in data)
      const { data, error } = await client
        .from('passenger_consents')
        .insert({
          ...consentData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create consent', error, {
          tripId,
          passengerId: payload.passenger_id,
        });
        return NextResponse.json(
          { error: 'Failed to create consent' },
          { status: 500 }
        );
      }

      result = data;
    }

    // Check if all passengers now consented
    const { data: allConsented } = await client.rpc(
      'all_passengers_consented',
      {
        trip_uuid: tripId,
      }
    );

    logger.info('Passenger consent saved', {
      consentId: result.id,
      tripId,
      passengerId: payload.passenger_id,
      allConsented,
    });

    return NextResponse.json({
      success: true,
      consent: result,
      all_consented: allConsented || false,
    });
  }
);
