/**
 * API: Guide Competency Assessment
 * Route: /api/guide/certifications/competency
 * Purpose: Submit and view MRA-TP competency assessments
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const submitAssessmentSchema = z.object({
  certificationType: z.string(),
  assessmentDate: z.string(),
  assessorName: z.string().optional(),
  assessorInstitution: z.string().optional(),
  knowledgeScore: z.number().min(0).max(100).optional(),
  skillScore: z.number().min(0).max(100).optional(),
  attitudeScore: z.number().min(0).max(100).optional(),
  overallScore: z.number().min(0).max(100),
  result: z.enum(['competent', 'not_yet_competent', 'pending']),
  notes: z.string().optional(),
  certificateNumber: z.string().optional(),
  certificateUrl: z.string().optional(),
  certificateValidUntil: z.string().optional(),
});

/**
 * GET /api/guide/certifications/competency
 * Get guide's competency assessment history
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: assessments, error } = await supabase
    .from('guide_competency_assessments')
    .select('*')
    .eq('guide_id', user.id)
    .order('assessment_date', { ascending: false });

  if (error) {
    logger.error('Failed to fetch competency assessments', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }

  return NextResponse.json({ assessments });
});

/**
 * POST /api/guide/certifications/competency
 * Submit new competency assessment (admin/assessor only)
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin or assessor
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (!profile || !['super_admin', 'ops_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = submitAssessmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Get guide_id from request (admin submitting for a guide)
  const guideId = body.guideId;
  if (!guideId) {
    return NextResponse.json({ error: 'Guide ID is required' }, { status: 400 });
  }

  // Insert assessment
  const { data: assessment, error } = await supabase
    .from('guide_competency_assessments')
    .insert({
      guide_id: guideId,
      certification_type: data.certificationType,
      assessment_date: data.assessmentDate,
      assessor_name: data.assessorName || null,
      assessor_institution: data.assessorInstitution || null,
      knowledge_score: data.knowledgeScore || null,
      skill_score: data.skillScore || null,
      attitude_score: data.attitudeScore || null,
      overall_score: data.overallScore,
      result: data.result,
      notes: data.notes || null,
      certificate_number: data.certificateNumber || null,
      certificate_url: data.certificateUrl || null,
      certificate_valid_until: data.certificateValidUntil || null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create competency assessment', error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }

  logger.info('Competency assessment created', { assessmentId: assessment.id, guideId });

  return NextResponse.json({
    success: true,
    assessment,
  });
});

