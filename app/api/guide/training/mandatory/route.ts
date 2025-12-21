/**
 * API: Guide Mandatory Training Status
 * GET /api/guide/training/mandatory - Get mandatory trainings untuk current guide
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  try {
    // Get compliance stats
    const { data: compliance } = await client.rpc('check_training_compliance', {
      p_guide_id: user.id,
    });

    const complianceStats = compliance?.[0] || {
      total_assignments: 0,
      completed_count: 0,
      pending_count: 0,
      overdue_count: 0,
      compliance_percentage: 100,
    };

    // Get mandatory training assignments
    const { data: assignments, error: assignmentsError } = await client
      .from('guide_mandatory_training_assignments')
      .select(`
        *,
        mandatory_training:mandatory_trainings(
          id,
          title,
          description,
          training_type,
          frequency
        )
      `)
      .eq('guide_id', user.id)
      .order('due_date', { ascending: true });

    if (assignmentsError) {
      logger.error('Failed to fetch assignments', assignmentsError);
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }

    // Separate by status
    const upcoming = (assignments || []).filter(
      (a: any) => a.status === 'pending' && new Date(a.due_date) >= new Date()
    );
    const overdue = (assignments || []).filter((a: any) => a.status === 'overdue');
    const completed = (assignments || []).filter((a: any) => a.status === 'completed');

    return NextResponse.json({
      compliance: {
        percentage: Number(complianceStats.compliance_percentage || 0),
        total_assignments: complianceStats.total_assignments || 0,
        completed_count: complianceStats.completed_count || 0,
        pending_count: complianceStats.pending_count || 0,
        overdue_count: complianceStats.overdue_count || 0,
      },
      assignments: {
        upcoming,
        overdue,
        completed,
        all: assignments || [],
      },
    });
  } catch (error) {
    logger.error('Failed to fetch mandatory training status', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
});

