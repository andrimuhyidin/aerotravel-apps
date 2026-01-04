/**
 * API: Get Quiz for Training Module
 * GET /api/guide/training/modules/[moduleId]/quiz - Get quiz ID for a training module
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) => {
  const supabase = await createClient();
  const { moduleId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get quiz for this training module
  const { data: quiz, error } = await withBranchFilter(
    client.from('training_quizzes'),
    branchContext,
  )
    .select('id')
    .eq('training_id', moduleId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    logger.warn('Failed to fetch quiz for training module', { 
      error: error instanceof Error ? error.message : String(error),
      moduleId 
    });
    return NextResponse.json({ quizId: null });
  }

  return NextResponse.json({ quizId: quiz?.id || null });
});

