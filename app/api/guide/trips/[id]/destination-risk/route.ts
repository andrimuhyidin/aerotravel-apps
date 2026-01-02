/**
 * API: Trip Destination Risk
 * GET /api/guide/trips/[id]/destination-risk - Get destination risk for trip
 * POST /api/guide/trips/[id]/destination-risk - Acknowledge destination risk
 * 
 * ISO 31030 Compliance: Travel Risk Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const acknowledgeSchema = z.object({
  acknowledgment_notes: z.string().optional(),
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

    const client = supabase as unknown as ReturnType<typeof createClient>;

    // Check if guide is assigned to trip
    const { data: assignment } = await client
      .from('trip_guides')
      .select('id')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .maybeSingle();

    if (!assignment) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get trip info and destination
    const { data: trip } = await client
      .from('trips')
      .select(`
        id,
        name,
        destination,
        departure_date,
        packages(
          destinations
        )
      `)
      .eq('id', tripId)
      .single();

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Check for existing trip destination risk record
    const { data: existingTripRisk } = await client
      .from('trip_destination_risks')
      .select(`
        *,
        destination:destination_risk_profiles(*)
      `)
      .eq('trip_id', tripId)
      .maybeSingle();

    if (existingTripRisk) {
      return NextResponse.json({
        trip_risk: existingTripRisk,
        destination: existingTripRisk.destination,
        acknowledged: !!existingTripRisk.acknowledged_at,
      });
    }

    // Try to find matching destination risk profile
    const branchContext = await getBranchContext(user.id);
    const destinationName = trip.destination || 
      (trip.packages as { destinations?: string[] } | null)?.destinations?.[0];

    let destinationRisk = null;
    if (destinationName) {
      const { data } = await withBranchFilter(
        client.from('destination_risk_profiles'),
        branchContext
      )
        .select('*')
        .or(`location_name.ilike.%${destinationName}%,location_code.ilike.%${destinationName}%`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      destinationRisk = data;
    }

    // If no specific profile found, get general risk info
    if (!destinationRisk) {
      // Return default risk assessment
      return NextResponse.json({
        trip_risk: null,
        destination: null,
        default_assessment: {
          threat_level: 'low',
          message: 'No specific risk profile found for this destination',
          recommendations: [
            'Standard safety procedures apply',
            'Monitor weather conditions before departure',
            'Ensure all safety equipment is checked',
          ],
        },
        acknowledged: false,
      });
    }

    // Calculate current risk score
    const { data: riskScore } = await client.rpc('calculate_destination_risk_score', {
      p_destination_id: destinationRisk.id,
    });

    return NextResponse.json({
      trip_risk: null,
      destination: destinationRisk,
      risk_score: riskScore || 50,
      acknowledged: false,
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
    const body = acknowledgeSchema.parse(await request.json());

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = supabase as unknown as ReturnType<typeof createClient>;

    // Check if guide is assigned to trip
    const { data: assignment } = await client
      .from('trip_guides')
      .select('id')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .maybeSingle();

    if (!assignment) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get destination from trip
    const { data: trip } = await client
      .from('trips')
      .select('destination')
      .eq('id', tripId)
      .single();

    // Find matching destination risk profile
    const branchContext = await getBranchContext(user.id);
    let destinationRisk = null;

    if (trip?.destination) {
      const { data } = await withBranchFilter(
        client.from('destination_risk_profiles'),
        branchContext
      )
        .select('*')
        .or(`location_name.ilike.%${trip.destination}%,location_code.ilike.%${trip.destination}%`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      destinationRisk = data;
    }

    // Check for existing record
    const { data: existing } = await client
      .from('trip_destination_risks')
      .select('id')
      .eq('trip_id', tripId)
      .maybeSingle();

    const tripRiskData = {
      trip_id: tripId,
      destination_id: destinationRisk?.id || null,
      threat_level_at_departure: destinationRisk?.threat_level || 'low',
      risk_factors_snapshot: destinationRisk?.risk_factors || null,
      seasonal_risk_snapshot: destinationRisk?.seasonal_risks || null,
      acknowledged_by: user.id,
      acknowledged_at: new Date().toISOString(),
      acknowledgment_notes: body.acknowledgment_notes || null,
    };

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await client
        .from('trip_destination_risks')
        .update({
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString(),
          acknowledgment_notes: body.acknowledgment_notes || null,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to acknowledge destination risk', error, { tripId });
        return NextResponse.json(
          { error: 'Failed to acknowledge risk' },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new
      const { data, error } = await client
        .from('trip_destination_risks')
        .insert(tripRiskData)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create trip destination risk', error, { tripId });
        return NextResponse.json(
          { error: 'Failed to record risk acknowledgment' },
          { status: 500 }
        );
      }
      result = data;
    }

    logger.info('Destination risk acknowledged', {
      tripId,
      destinationId: destinationRisk?.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      trip_risk: result,
      acknowledged: true,
    });
  }
);

