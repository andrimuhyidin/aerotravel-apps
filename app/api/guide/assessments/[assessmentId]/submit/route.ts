/**
 * API: Submit Assessment
 * POST /api/guide/assessments/[assessmentId]/submit
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { generateContent } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ assessmentId: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { assessmentId } = await params;
  const body = await request.json().catch(() => ({}));
  const { answers } = body;

  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'answers is required' }, { status: 400 });
  }

  try {
    // Get assessment
    const { data: assessment, error: assessmentError } = await (supabase as any)
      .from('guide_assessments')
      .select(`
        *,
        template:guide_assessment_templates(*)
      `)
      .eq('id', assessmentId)
      .eq('guide_id', user.id)
      .maybeSingle();

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    if (assessment.status === 'completed') {
      return NextResponse.json({ error: 'Assessment already completed' }, { status: 400 });
    }

    const template = assessment.template;

    // Calculate score
    let score: number | null = null;
    let category: string | null = null;

    const questions = Array.isArray(template.questions) ? template.questions : [];

    if (template.assessment_type === 'quiz' && template.scoring_config) {
      // Calculate quiz score
      let totalWeight = 0;
      let correctWeight = 0;

      questions.forEach((q: { id: string; type: string; correct_answer?: number; weight?: number }) => {
        const weight = q.weight || 1;
        totalWeight += weight;
        const userAnswer = answers[q.id];
        if (q.type === 'multiple_choice' && q.correct_answer !== undefined) {
          if (userAnswer === q.correct_answer) {
            correctWeight += weight;
          }
        }
      });

      score = totalWeight > 0 ? Math.round((correctWeight / totalWeight) * 100) : 0;
    } else if (template.assessment_type === 'rating' && template.scoring_config) {
      // Calculate rating average
      let totalWeight = 0;
      let weightedSum = 0;

      questions.forEach((q: { id: string; type: string; weight?: number; scale?: number }) => {
        const weight = q.weight || 1;
        const scale = q.scale || 5;
        const userAnswer = answers[q.id];
        if (typeof userAnswer === 'number' && userAnswer >= 1 && userAnswer <= scale) {
          totalWeight += weight;
          weightedSum += userAnswer * weight;
        }
      });

      const firstQuestionScale = questions[0] && typeof questions[0] === 'object' && 'scale' in questions[0] ? questions[0].scale : 5;
      score = totalWeight > 0 ? Math.round((weightedSum / totalWeight / firstQuestionScale) * 100) : 0;
    }

    // Determine category
    if (template.result_categories && score !== null && Array.isArray(template.result_categories)) {
      const categories = template.result_categories as Array<{
        min: number;
        max: number;
        category: string;
      }>;
      const matched = categories.find((c) => score! >= c.min && score! <= c.max);
      category = matched?.category || null;
    }

    // Generate AI insights
    let insights: Record<string, unknown> | null = null;
    try {
      const prompt = `Analyze this assessment result for a tour guide:

Assessment: ${template.name}
Category: ${template.category}
Score: ${score !== null ? score : 'N/A'}
Answers: ${JSON.stringify(answers)}

Provide insights in JSON format:
{
  "summary": "brief summary of performance",
  "strengths": ["strength1", "strength2"],
  "improvements": ["area1", "area2"],
  "recommendations": ["recommendation1", "recommendation2"]
}

Return ONLY the JSON object, no additional text.`;

      const aiResponse = await generateContent(prompt);
      const cleaned = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      insights = JSON.parse(cleaned);
    } catch (aiError) {
      logger.warn('Failed to generate AI insights', { assessmentId, error: aiError });
      // Continue without insights
    }

    // Update assessment
    const { data: updatedAssessment, error: updateError } = await (supabase as any)
      .from('guide_assessments')
      .update({
        answers,
        score,
        category,
        insights,
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', assessmentId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to submit assessment', updateError, { assessmentId });
      return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      assessment: updatedAssessment,
      score,
      category,
      insights,
    });
  } catch (error) {
    logger.error('Failed to submit assessment', error, { assessmentId });
    return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 });
  }
});
