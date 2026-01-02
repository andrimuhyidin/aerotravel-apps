/**
 * API: Compliance Dashboard
 * GET /api/admin/compliance/dashboard - Get compliance dashboard data
 * 
 * Standards: CHSE, GSTC, Duty of Care, ISO 31030
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type ComplianceStandard = 'chse' | 'gstc' | 'duty_of_care' | 'iso_31030';

export type ComplianceStatus = {
  standard: ComplianceStandard;
  standardName: string;
  status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
  complianceLevel: number;
  lastAssessment: string | null;
  nextAssessment: string | null;
  openIssues: number;
  isCertified: boolean;
  certValidUntil: string | null;
};

export type ComplianceDashboardData = {
  overallScore: number;
  overallStatus: string;
  standards: ComplianceStatus[];
  recentAudits: Array<{
    id: string;
    auditType: string;
    auditDate: string;
    score: number;
    result: string;
  }>;
  upcomingActions: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: string;
    status: string;
  }>;
  metrics: {
    totalAudits: number;
    passRate: number;
    avgScore: number;
    openNonConformities: number;
  };
};

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if admin
  const client = supabase as unknown as ReturnType<typeof createClient>;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'ops_admin'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);
  const branchId = branchContext.branchId;

  if (!branchId) {
    return NextResponse.json(
      { error: 'Branch context required' },
      { status: 400 }
    );
  }

  try {
    // Get compliance status for each standard
    const { data: statusData } = await client
      .from('compliance_status_tracker')
      .select('*')
      .eq('branch_id', branchId);

    const standardNames: Record<ComplianceStandard, string> = {
      chse: 'CHSE Protocol (Kemenkes)',
      gstc: 'GSTC Sustainable Tourism',
      duty_of_care: 'Duty of Care Policy',
      iso_31030: 'ISO 31030 TRM',
    };

    const standards: ComplianceStatus[] = (['chse', 'gstc', 'duty_of_care', 'iso_31030'] as ComplianceStandard[]).map(
      (standard) => {
        const found = statusData?.find((s) => s.standard_type === standard);
      return {
          standard,
          standardName: standardNames[standard],
          status: (found?.current_status as ComplianceStatus['status']) || 'not_assessed',
          complianceLevel: found?.compliance_level || 0,
          lastAssessment: found?.last_assessment_date || null,
          nextAssessment: found?.next_assessment_date || null,
          openIssues: found?.open_non_conformities || 0,
          isCertified: found?.is_certified || false,
          certValidUntil: found?.certification_valid_until || null,
      };
      }
    );

    // Calculate overall score
    const assessedStandards = standards.filter((s) => s.status !== 'not_assessed');
    const overallScore = assessedStandards.length > 0
      ? Math.round(
          assessedStandards.reduce((sum, s) => sum + s.complianceLevel, 0) /
            assessedStandards.length
        )
      : 0;

    const overallStatus =
      overallScore >= 90
        ? 'compliant'
        : overallScore >= 70
        ? 'partially_compliant'
        : overallScore > 0
        ? 'non_compliant'
        : 'not_assessed';

    // Get recent audits
    const { data: recentAudits } = await client
      .from('compliance_audit_logs')
      .select('id, audit_type, audit_date, compliance_score, audit_result')
      .eq('branch_id', branchId)
      .order('audit_date', { ascending: false })
      .limit(5);

    // Get upcoming actions
    const { data: upcomingActions } = await client
      .from('trm_improvement_actions')
      .select('id, title, due_date, priority, status')
      .eq('branch_id', branchId)
      .in('status', ['open', 'in_progress'])
      .order('due_date', { ascending: true })
    .limit(10);

    // Get metrics
    const { data: allAudits } = await client
      .from('compliance_audit_logs')
      .select('id, compliance_score, audit_result')
      .eq('branch_id', branchId);

    const totalAudits = allAudits?.length || 0;
    const passedAudits = allAudits?.filter(
      (a) => a.audit_result === 'pass' || a.audit_result === 'conditional_pass'
    ).length || 0;
    const passRate = totalAudits > 0 ? Math.round((passedAudits / totalAudits) * 100) : 0;
    const avgScore = allAudits && allAudits.length > 0
      ? Math.round(
          allAudits.reduce((sum, a) => sum + (a.compliance_score || 0), 0) /
            allAudits.length
        )
      : 0;

    // Count open non-conformities
    const openNonConformities = standards.reduce((sum, s) => sum + s.openIssues, 0);

    const dashboardData: ComplianceDashboardData = {
      overallScore,
      overallStatus,
      standards,
      recentAudits:
        recentAudits?.map((a) => ({
          id: a.id,
          auditType: a.audit_type,
          auditDate: a.audit_date,
          score: a.compliance_score || 0,
          result: a.audit_result,
        })) || [],
      upcomingActions:
        upcomingActions?.map((a) => ({
      id: a.id,
          title: a.title,
          dueDate: a.due_date,
          priority: a.priority,
          status: a.status,
        })) || [],
      metrics: {
        totalAudits,
        passRate,
        avgScore,
        openNonConformities,
      },
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    logger.error('Failed to fetch compliance dashboard', error, { branchId });
    return NextResponse.json(
      { error: 'Failed to fetch compliance dashboard' },
      { status: 500 }
    );
  }
});
