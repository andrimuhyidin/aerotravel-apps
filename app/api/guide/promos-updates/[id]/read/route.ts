/**
 * API: Mark Promo as Read
 * POST /api/guide/promos-updates/[id]/read - Mark a promo/update/announcement as read
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: promoId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  try {
    // First verify promo exists and is accessible
    const { data: promo, error: promoError } = await client
      .from('guide_promos')
      .select('id')
      .eq('id', promoId)
      .eq('is_active', true)
      .maybeSingle();

    if (promoError || !promo) {
      logger.warn('Promo not found or not accessible', { promoId, guideId: user.id });
      return NextResponse.json({ error: 'Promo not found' }, { status: 404 });
    }

    // Upsert read status (ignore if already exists due to UNIQUE constraint)
    const { error: insertError } = await client
      .from('guide_promo_reads')
      .insert({
        promo_id: promoId,
        guide_id: user.id,
        read_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      // Ignore unique constraint violation (already read)
      if (insertError.code !== '23505') {
        logger.error('Failed to mark promo as read', insertError, {
          promoId,
          guideId: user.id,
        });
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to mark promo as read', error, { promoId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
});

