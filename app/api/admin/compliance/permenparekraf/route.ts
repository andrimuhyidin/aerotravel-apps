/**
 * API: Permenparekraf Self-Assessment
 * Route: /api/admin/compliance/permenparekraf
 * Purpose: Manage Permenparekraf No.4/2021 self-assessments
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createAssessmentSchema = z.object({
  branchId: z.string().uuid().optional(),
  assessmentType: z.enum(['agen_perjalanan_wisata', 'biro_perjalanan_wisata', 'penyelenggara_perjalanan_wisata', 'usaha_daya_tarik_wisata']),
  assessmentDate: z.string(),
  assessmentYear: z.number(),
  sectionScores: z.object({
    legalitas: z.number().min(0).max(100),
    sdm: z.number().min(0).max(100),
    sarana_prasarana: z.number().min(0).max(100),
    pelayanan: z.number().min(0).max(100),
    keuangan: z.number().min(0).max(100),
    lingkungan: z.number().min(0).max(100),
  }),
  evidenceUrls: z.array(z.string()).optional(),
  evidenceNotes: z.string().optional(),
});

/**
 * GET /api/admin/compliance/permenparekraf
 * Get list of self-assessments
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (!profile || !['super_admin', 'ops_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const assessmentType = searchParams.get('type');

  let query = supabase
    .from('permenparekraf_self_assessments')
    .select('*')
    .order('assessment_date', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (assessmentType) {
    query = query.eq('assessment_type', assessmentType);
  }

  const { data: assessments, error } = await query;

  if (error) {
    logger.error('Failed to fetch assessments', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }

  return NextResponse.json({ assessments });
});

/**
 * POST /api/admin/compliance/permenparekraf
 * Create new self-assessment
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (!profile || !['super_admin', 'ops_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createAssessmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Calculate total score (weighted average)
  const weights = {
    legalitas: 0.2,
    sdm: 0.2,
    sarana_prasarana: 0.2,
    pelayanan: 0.2,
    keuangan: 0.1,
    lingkungan: 0.1,
  };

  const totalScore = Math.round(
    data.sectionScores.legalitas * weights.legalitas * 10 +
    data.sectionScores.sdm * weights.sdm * 10 +
    data.sectionScores.sarana_prasarana * weights.sarana_prasarana * 10 +
    data.sectionScores.pelayanan * weights.pelayanan * 10 +
    data.sectionScores.keuangan * weights.keuangan * 10 +
    data.sectionScores.lingkungan * weights.lingkungan * 10
  );

  // Determine grade using database function
  const { data: gradeResult } = await supabase.rpc('calculate_assessment_grade', {
    p_total_score: totalScore,
    p_business_type: data.assessmentType,
  });

  const grade = gradeResult || 'TL';

  // Insert assessment
  const { data: assessment, error } = await supabase
    .from('permenparekraf_self_assessments')
    .insert({
      branch_id: data.branchId || null,
      assessment_date: data.assessmentDate,
      assessment_type: data.assessmentType,
      assessment_year: data.assessmentYear,
      total_score: totalScore,
      grade,
      section_scores: data.sectionScores,
      section_legalitas: data.sectionScores.legalitas,
      section_sdm: data.sectionScores.sdm,
      section_sarana_prasarana: data.sectionScores.sarana_prasarana,
      section_pelayanan: data.sectionScores.pelayanan,
      section_keuangan: data.sectionScores.keuangan,
      section_lingkungan: data.sectionScores.lingkungan,
      evidence_urls: data.evidenceUrls || null,
      evidence_notes: data.evidenceNotes || null,
      status: 'draft',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create assessment', error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }

  logger.info('Self-assessment created', { assessmentId: assessment.id, grade, totalScore });

  return NextResponse.json({
    success: true,
    assessment,
    summary: {
      totalScore,
      grade,
      status: 'draft',
    },
  });
});

