/**
 * API: MRA-TP Competency Units Progress
 * Route: /api/guide/certifications/competency/progress
 * Purpose: Track guide progress on MRA-TP competency units
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateProgressSchema = z.object({
  unitId: z.string().uuid(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'failed']),
  score: z.number().min(0).max(100).optional(),
  evidenceUrls: z.array(z.string()).optional(),
  assessorNotes: z.string().optional(),
});

/**
 * GET /api/guide/certifications/competency/progress
 * Get guide's competency unit progress
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get progress with unit details
  const { data: progress, error } = await supabase
    .from('guide_competency_unit_progress')
    .select(
      `
      *,
      mra_tp_competency_units (
        id,
        unit_code,
        unit_title,
        description,
        category,
        level,
        minimum_score
      )
    `
    )
    .eq('guide_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch competency progress', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }

  // Calculate completion percentage
  const completed = progress?.filter((p) => p.status === 'completed').length || 0;
  const total = progress?.length || 0;
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return NextResponse.json({
    progress,
    summary: {
      totalUnits: total,
      completedUnits: completed,
      inProgressUnits: progress?.filter((p) => p.status === 'in_progress').length || 0,
      completionPercentage,
    },
  });
});

/**
 * POST /api/guide/certifications/competency/progress
 * Update competency unit progress
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateProgressSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Check if progress record exists
  const { data: existing } = await supabase
    .from('guide_competency_unit_progress')
    .select('id')
    .eq('guide_id', user.id)
    .eq('unit_id', data.unitId)
    .single();

  const progressData = {
    status: data.status,
    score: data.score || null,
    evidence_urls: data.evidenceUrls || null,
    assessor_notes: data.assessorNotes || null,
    ...(data.status === 'in_progress' && !existing ? { started_at: new Date().toISOString() } : {}),
    ...(data.status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
  };

  if (existing) {
    // Update existing progress
    const { data: updated, error } = await supabase
      .from('guide_competency_unit_progress')
      .update(progressData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update progress', error);
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }

    return NextResponse.json({ success: true, progress: updated });
  } else {
    // Create new progress record
    const { data: created, error } = await supabase
      .from('guide_competency_unit_progress')
      .insert({
        guide_id: user.id,
        unit_id: data.unitId,
        ...progressData,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create progress', error);
      return NextResponse.json({ error: 'Failed to create progress' }, { status: 500 });
    }

    return NextResponse.json({ success: true, progress: created });
  }
});

