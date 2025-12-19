/**
 * API: Check if Trip Can Start
 * GET /api/guide/trips/[id]/can-start - Check if trip can start (certifications + risk assessment)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
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

  // Check using database function
  const { data: canStart, error } = await client.rpc('can_trip_start', {
    trip_uuid: tripId,
    guide_uuid: user.id,
  });

  if (error) {
    logger.error('Failed to check trip start eligibility', error, { tripId, guideId: user.id });
    // Fallback: manual check
    const { data: certValid } = await client.rpc('check_guide_certifications_valid', {
      guide_uuid: user.id,
    });

    const { data: assessment } = await client
      .from('pre_trip_assessments')
      .select('is_safe')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      can_start: (certValid || false) && (assessment?.is_safe || false),
      certifications_valid: certValid || false,
      risk_assessment_safe: assessment?.is_safe || false,
      reasons: [
        !certValid && 'Certifications tidak valid atau expired',
        !assessment?.is_safe && 'Risk assessment menunjukkan risiko tinggi',
      ].filter(Boolean),
    });
  }

  // Get detailed reasons if cannot start
  const reasons: string[] = [];
  const { data: certValid } = await client.rpc('check_guide_certifications_valid', {
    guide_uuid: user.id,
  });
  if (!certValid) {
    reasons.push('Certifications tidak valid atau expired');
  }

  const { data: assessment } = await client
    .from('pre_trip_assessments')
    .select('is_safe, risk_level')
    .eq('trip_id', tripId)
    .eq('guide_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!assessment?.is_safe) {
    reasons.push(`Risk assessment: ${assessment?.risk_level || 'unknown'} risk`);
  }

  return NextResponse.json({
    can_start: canStart || false,
    certifications_valid: certValid || false,
    risk_assessment_safe: assessment?.is_safe || false,
    reasons: reasons.length > 0 ? reasons : undefined,
  });
});
