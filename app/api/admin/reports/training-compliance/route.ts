/**
 * API: Training Compliance Report
 * GET /api/admin/reports/training-compliance - Get training compliance report per guide
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const allowed = await hasRole(['super_admin', 'ops_admin']);

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get('branch_id');
  const status = searchParams.get('status'); // 'compliant' | 'non-compliant'

  const client = supabase as unknown as any;

  try {
    // Get all guides in branch
    let guidesQuery = client.from('users').select('id, first_name, last_name, email');

    if (branchId && branchContext.isSuperAdmin) {
      guidesQuery = guidesQuery.eq('branch_id', branchId);
    } else if (branchContext.branchId) {
      guidesQuery = guidesQuery.eq('branch_id', branchContext.branchId);
    }

    // Filter by role (guides only)
    guidesQuery = guidesQuery.eq('role', 'guide');

    const { data: guides, error: guidesError } = await guidesQuery;

    if (guidesError) {
      logger.error('Failed to fetch guides', guidesError);
      return NextResponse.json({ error: 'Failed to fetch guides' }, { status: 500 });
    }

    // Get compliance data for each guide
    const complianceData = await Promise.all(
      (guides || []).map(async (guide: any) => {
        const { data: compliance } = await client.rpc('check_training_compliance', {
          p_guide_id: guide.id,
        });

        const complianceStats = compliance?.[0] || {
          total_assignments: 0,
          completed_count: 0,
          pending_count: 0,
          overdue_count: 0,
          compliance_percentage: 100,
        };

        // Get mandatory trainings details
        const { data: assignments } = await client
          .from('guide_mandatory_training_assignments')
          .select(`
            *,
            mandatory_training:mandatory_trainings(
              id,
              title,
              training_type,
              frequency
            )
          `)
          .eq('guide_id', guide.id)
          .order('due_date', { ascending: true });

        return {
          guide_id: guide.id,
          guide_name: `${guide.first_name || ''} ${guide.last_name || ''}`.trim() || guide.email,
          guide_email: guide.email,
          compliance_percentage: Number(complianceStats.compliance_percentage || 0),
          total_assignments: complianceStats.total_assignments || 0,
          completed_count: complianceStats.completed_count || 0,
          pending_count: complianceStats.pending_count || 0,
          overdue_count: complianceStats.overdue_count || 0,
          assignments: assignments || [],
          status: complianceStats.compliance_percentage >= 100 ? 'compliant' : 'non-compliant',
        };
      })
    );

    // Filter by status if provided
    let filteredData = complianceData;
    if (status === 'compliant') {
      filteredData = complianceData.filter((item) => item.status === 'compliant');
    } else if (status === 'non-compliant') {
      filteredData = complianceData.filter((item) => item.status === 'non-compliant');
    }

    // Sort by compliance percentage (lowest first)
    filteredData.sort((a, b) => a.compliance_percentage - b.compliance_percentage);

    return NextResponse.json({
      guides: filteredData,
      summary: {
        total_guides: filteredData.length,
        compliant_count: filteredData.filter((g) => g.status === 'compliant').length,
        non_compliant_count: filteredData.filter((g) => g.status === 'non-compliant').length,
        avg_compliance_percentage:
          filteredData.length > 0
            ? Number(
                (
                  filteredData.reduce((sum, g) => sum + g.compliance_percentage, 0) /
                  filteredData.length
                ).toFixed(2)
              )
            : 0,
      },
    });
  } catch (error) {
    logger.error('Failed to generate training compliance report', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
});

