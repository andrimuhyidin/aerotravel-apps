/**
 * API: Compliance Reports
 * GET /api/admin/reports/compliance - Generate compliance report
 * 
 * Report Types:
 * - CHSE Self-Assessment Report
 * - GSTC Sustainability Report
 * - Duty of Care Compliance Summary
 * - ISO 31030 TRM Status Report
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const reportQuerySchema = z.object({
  type: z.enum(['chse', 'gstc', 'duty_of_care', 'iso_31030', 'combined']).optional().default('combined'),
  year: z.coerce.number().optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  format: z.enum(['json', 'summary']).optional().default('json'),
});

type ReportType = 'chse' | 'gstc' | 'duty_of_care' | 'iso_31030' | 'combined';

type ComplianceReportData = {
  reportType: ReportType;
  reportTitle: string;
  generatedAt: string;
  period: {
    year: number;
    month?: number;
    startDate: string;
    endDate: string;
  };
  branch: {
    id: string;
    name: string;
  };
  summary: {
    overallScore: number;
    status: string;
    standardsAssessed: number;
    openIssues: number;
    recommendations: string[];
  };
  sections: Array<{
    sectionName: string;
    score: number;
    maxScore: number;
    items: Array<{
      item: string;
      status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
      notes?: string;
    }>;
  }>;
  metrics: Record<string, number | string>;
  trends?: Array<{
    period: string;
    score: number;
  }>;
};

async function generateCHSEReport(
  client: ReturnType<typeof createClient>,
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<Partial<ComplianceReportData>> {
  // Get CHSE daily logs
  const { data: chseLogs } = await client
    .from('chse_daily_logs')
    .select('*')
    .eq('branch_id', branchId)
    .gte('log_date', startDate.toISOString().split('T')[0])
    .lte('log_date', endDate.toISOString().split('T')[0]);

  const avgClean = chseLogs && chseLogs.length > 0
    ? Math.round(chseLogs.reduce((sum, l) => sum + (l.clean_score || 0), 0) / chseLogs.length)
    : 0;
  const avgHealth = chseLogs && chseLogs.length > 0
    ? Math.round(chseLogs.reduce((sum, l) => sum + (l.health_score || 0), 0) / chseLogs.length)
    : 0;
  const avgSafety = chseLogs && chseLogs.length > 0
    ? Math.round(chseLogs.reduce((sum, l) => sum + (l.safety_score || 0), 0) / chseLogs.length)
    : 0;
  const avgEnvironment = chseLogs && chseLogs.length > 0
    ? Math.round(chseLogs.reduce((sum, l) => sum + (l.environment_score || 0), 0) / chseLogs.length)
    : 0;

  const overallScore = Math.round((avgClean + avgHealth + avgSafety + avgEnvironment) / 4);

  // Get sanitization records
  const { data: sanitizations } = await client
    .from('sanitization_records')
    .select('*')
    .eq('branch_id', branchId)
    .gte('started_at', startDate.toISOString())
    .lte('started_at', endDate.toISOString());

  // Get CHSE certificates
  const { data: certificates } = await client
    .from('chse_certificates')
    .select('*')
    .eq('branch_id', branchId)
    .eq('status', 'active');

  return {
    summary: {
      overallScore,
      status: overallScore >= 80 ? 'compliant' : overallScore >= 60 ? 'partially_compliant' : 'non_compliant',
      standardsAssessed: 1,
      openIssues: 0,
      recommendations: [
        overallScore < 80 ? 'Tingkatkan protokol kebersihan harian' : '',
        avgSafety < 80 ? 'Review prosedur keselamatan' : '',
      ].filter(Boolean),
    },
    sections: [
      {
        sectionName: 'Cleanliness (C)',
        score: avgClean,
        maxScore: 100,
        items: [
          { item: 'Daily cleaning protocols', status: avgClean >= 80 ? 'compliant' : 'partial' },
          { item: 'Waste management', status: avgClean >= 80 ? 'compliant' : 'partial' },
        ],
      },
      {
        sectionName: 'Health (H)',
        score: avgHealth,
        maxScore: 100,
        items: [
          { item: 'Hand sanitizer availability', status: avgHealth >= 80 ? 'compliant' : 'partial' },
          { item: 'First aid kit complete', status: avgHealth >= 80 ? 'compliant' : 'partial' },
        ],
      },
      {
        sectionName: 'Safety (S)',
        score: avgSafety,
        maxScore: 100,
        items: [
          { item: 'Safety equipment check', status: avgSafety >= 80 ? 'compliant' : 'partial' },
          { item: 'Emergency procedures', status: avgSafety >= 80 ? 'compliant' : 'partial' },
        ],
      },
      {
        sectionName: 'Environment (E)',
        score: avgEnvironment,
        maxScore: 100,
        items: [
          { item: 'Waste segregation', status: avgEnvironment >= 80 ? 'compliant' : 'partial' },
          { item: 'Environmental awareness', status: avgEnvironment >= 80 ? 'compliant' : 'partial' },
        ],
      },
    ],
    metrics: {
      totalCHSELogs: chseLogs?.length || 0,
      totalSanitizations: sanitizations?.length || 0,
      activeCertificates: certificates?.length || 0,
      avgCleanScore: avgClean,
      avgHealthScore: avgHealth,
      avgSafetyScore: avgSafety,
      avgEnvironmentScore: avgEnvironment,
    },
  };
}

async function generateGSTCReport(
  client: ReturnType<typeof createClient>,
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<Partial<ComplianceReportData>> {
  // Get sustainability metrics
  const { data: sustainabilityMetrics } = await client
    .from('sustainability_metrics_monthly')
    .select('*')
    .eq('branch_id', branchId)
    .gte('metric_month', startDate.toISOString().split('T')[0])
    .lte('metric_month', endDate.toISOString().split('T')[0])
    .order('metric_month', { ascending: false })
    .limit(1);

  const metrics = sustainabilityMetrics?.[0];

  // Get community contributions
  const { data: contributions } = await client
    .from('community_contributions')
    .select('*')
    .eq('branch_id', branchId)
    .gte('contribution_date', startDate.toISOString().split('T')[0])
    .lte('contribution_date', endDate.toISOString().split('T')[0]);

  const totalContributionValue = contributions?.reduce((sum, c) => sum + (c.total_value || 0), 0) || 0;

  // Get local employment data
  const { data: employment } = await client
    .from('local_employment_metrics')
    .select('*')
    .eq('branch_id', branchId)
    .order('period_month', { ascending: false })
    .limit(1);

  const localEmploymentRate = employment?.[0]?.local_percentage || 0;

  // Calculate score based on metrics
  let score = 50; // Base score
  if (metrics?.recycling_rate && metrics.recycling_rate >= 50) score += 15;
  if (localEmploymentRate >= 70) score += 15;
  if (totalContributionValue > 0) score += 10;
  if (metrics?.co2_change_percent && metrics.co2_change_percent < 0) score += 10;

  return {
    summary: {
      overallScore: Math.min(100, score),
      status: score >= 80 ? 'compliant' : score >= 60 ? 'partially_compliant' : 'non_compliant',
      standardsAssessed: 1,
      openIssues: 0,
      recommendations: [
        (metrics?.recycling_rate || 0) < 50 ? 'Tingkatkan tingkat daur ulang' : '',
        localEmploymentRate < 70 ? 'Prioritaskan perekrutan tenaga kerja lokal' : '',
      ].filter(Boolean),
    },
    sections: [
      {
        sectionName: 'Environmental Management',
        score: Math.round((metrics?.recycling_rate || 0)),
        maxScore: 100,
        items: [
          { item: 'Waste tracking implemented', status: 'compliant' },
          { item: 'Carbon footprint monitoring', status: metrics ? 'compliant' : 'non_compliant' },
          { item: 'Recycling program', status: (metrics?.recycling_rate || 0) >= 50 ? 'compliant' : 'partial' },
        ],
      },
      {
        sectionName: 'Community Benefits',
        score: Math.round(localEmploymentRate),
        maxScore: 100,
        items: [
          { item: 'Local employment tracking', status: employment?.[0] ? 'compliant' : 'non_compliant' },
          { item: 'Community contributions', status: (contributions?.length || 0) > 0 ? 'compliant' : 'non_compliant' },
        ],
      },
    ],
    metrics: {
      totalWasteKg: metrics?.total_waste_kg || 0,
      recyclingRate: `${metrics?.recycling_rate || 0}%`,
      totalCO2Kg: metrics?.total_co2_kg || 0,
      co2ChangePercent: `${metrics?.co2_change_percent || 0}%`,
      localEmploymentRate: `${localEmploymentRate}%`,
      communityContributions: contributions?.length || 0,
      totalContributionValue: `Rp ${totalContributionValue.toLocaleString('id-ID')}`,
    },
  };
}

async function generateISO31030Report(
  client: ReturnType<typeof createClient>,
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<Partial<ComplianceReportData>> {
  // Get TRM performance metrics
  const { data: trmMetrics } = await client
    .from('trm_performance_metrics')
    .select('*')
    .eq('branch_id', branchId)
    .gte('metric_period', startDate.toISOString().split('T')[0])
    .lte('metric_period', endDate.toISOString().split('T')[0])
    .order('metric_period', { ascending: false })
    .limit(1);

  const metrics = trmMetrics?.[0];

  // Get training compliance
  const { data: trainingCompliance } = await client.rpc('calculate_branch_training_compliance', {
    p_branch_id: branchId,
  });

  const trainingRate = trainingCompliance?.[0]?.compliance_rate || 0;

  // Get incidents
  const { data: incidents } = await client
    .from('incident_reports')
    .select('id, severity')
    .eq('branch_id', branchId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const highSeverityIncidents = incidents?.filter((i) => i.severity === 'high' || i.severity === 'critical').length || 0;

  // Calculate score
  let score = 50;
  if ((metrics?.risk_assessments_rate || 0) >= 90) score += 20;
  if (trainingRate >= 90) score += 15;
  if (highSeverityIncidents === 0) score += 15;

  return {
    summary: {
      overallScore: Math.min(100, score),
      status: score >= 80 ? 'compliant' : score >= 60 ? 'partially_compliant' : 'non_compliant',
      standardsAssessed: 1,
      openIssues: highSeverityIncidents,
      recommendations: [
        (metrics?.risk_assessments_rate || 0) < 90 ? 'Lengkapi pre-trip risk assessment untuk semua trip' : '',
        trainingRate < 90 ? 'Pastikan semua guide menyelesaikan TRM training' : '',
        highSeverityIncidents > 0 ? 'Review dan tutup incident dengan severity tinggi' : '',
      ].filter(Boolean),
    },
    sections: [
      {
        sectionName: 'Risk Assessment',
        score: Math.round(metrics?.risk_assessments_rate || 0),
        maxScore: 100,
        items: [
          { item: 'Pre-trip risk assessment', status: (metrics?.risk_assessments_rate || 0) >= 90 ? 'compliant' : 'partial' },
          { item: 'Destination risk profiles', status: 'compliant' },
        ],
      },
      {
        sectionName: 'Emergency Response',
        score: metrics?.sos_alerts_count === 0 ? 100 : 70,
        maxScore: 100,
        items: [
          { item: 'SOS system implemented', status: 'compliant' },
          { item: 'Crisis communication plan', status: 'compliant' },
        ],
      },
      {
        sectionName: 'Training & Competency',
        score: Math.round(trainingRate),
        maxScore: 100,
        items: [
          { item: 'TRM training for guides', status: trainingRate >= 90 ? 'compliant' : 'partial' },
          { item: 'Emergency response drills', status: 'partial' },
        ],
      },
    ],
    metrics: {
      totalTrips: metrics?.total_trips || 0,
      riskAssessmentRate: `${metrics?.risk_assessments_rate || 0}%`,
      trainingComplianceRate: `${trainingRate}%`,
      totalIncidents: incidents?.length || 0,
      highSeverityIncidents,
      sosAlerts: metrics?.sos_alerts_count || 0,
      overallTRMScore: metrics?.overall_trm_score || 0,
    },
  };
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const params = reportQuerySchema.parse({
    type: searchParams.get('type') || 'combined',
    year: searchParams.get('year'),
    month: searchParams.get('month'),
    format: searchParams.get('format') || 'json',
  });

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
    .select('role, branch_id')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'ops_admin'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);
  const branchId = branchContext.branchId;

  if (!branchId) {
    return NextResponse.json({ error: 'Branch context required' }, { status: 400 });
  }

  // Calculate date range
  const year = params.year || new Date().getFullYear();
  const month = params.month;
  
  let startDate: Date;
  let endDate: Date;
  
  if (month) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0);
  } else {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31);
  }

  // Get branch info
  const { data: branch } = await client
    .from('branches')
    .select('id, name')
    .eq('id', branchId)
    .single();

  try {
    const reportTitles: Record<ReportType, string> = {
      chse: 'CHSE Protocol Compliance Report',
      gstc: 'GSTC Sustainability Report',
      duty_of_care: 'Duty of Care Compliance Report',
      iso_31030: 'ISO 31030 TRM Status Report',
      combined: 'Combined Compliance Standards Report',
    };

    let reportData: Partial<ComplianceReportData> = {};

    if (params.type === 'chse') {
      reportData = await generateCHSEReport(client, branchId, startDate, endDate);
    } else if (params.type === 'gstc') {
      reportData = await generateGSTCReport(client, branchId, startDate, endDate);
    } else if (params.type === 'iso_31030') {
      reportData = await generateISO31030Report(client, branchId, startDate, endDate);
    } else {
      // Combined report
      const chseData = await generateCHSEReport(client, branchId, startDate, endDate);
      const gstcData = await generateGSTCReport(client, branchId, startDate, endDate);
      const isoData = await generateISO31030Report(client, branchId, startDate, endDate);

      const combinedScore = Math.round(
        ((chseData.summary?.overallScore || 0) +
          (gstcData.summary?.overallScore || 0) +
          (isoData.summary?.overallScore || 0)) /
          3
      );

      reportData = {
        summary: {
          overallScore: combinedScore,
          status: combinedScore >= 80 ? 'compliant' : combinedScore >= 60 ? 'partially_compliant' : 'non_compliant',
          standardsAssessed: 3,
          openIssues:
            (chseData.summary?.openIssues || 0) +
            (gstcData.summary?.openIssues || 0) +
            (isoData.summary?.openIssues || 0),
          recommendations: [
            ...(chseData.summary?.recommendations || []),
            ...(gstcData.summary?.recommendations || []),
            ...(isoData.summary?.recommendations || []),
          ].slice(0, 5),
        },
        sections: [
          ...(chseData.sections || []),
          ...(gstcData.sections || []),
          ...(isoData.sections || []),
        ],
        metrics: {
          chseScore: chseData.summary?.overallScore || 0,
          gstcScore: gstcData.summary?.overallScore || 0,
          iso31030Score: isoData.summary?.overallScore || 0,
          ...chseData.metrics,
          ...gstcData.metrics,
          ...isoData.metrics,
        },
      };
    }

    const fullReport: ComplianceReportData = {
      reportType: params.type,
      reportTitle: reportTitles[params.type],
      generatedAt: new Date().toISOString(),
      period: {
        year,
        month,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      branch: {
        id: branchId,
        name: branch?.name || 'Unknown Branch',
      },
      summary: reportData.summary || {
        overallScore: 0,
        status: 'not_assessed',
        standardsAssessed: 0,
        openIssues: 0,
        recommendations: [],
      },
      sections: reportData.sections || [],
      metrics: reportData.metrics || {},
      trends: reportData.trends,
    };

    logger.info('Compliance report generated', {
      reportType: params.type,
      branchId,
      year,
      month,
    });

    return NextResponse.json(fullReport);
  } catch (error) {
    logger.error('Failed to generate compliance report', error, {
      reportType: params.type,
      branchId,
    });
    return NextResponse.json(
      { error: 'Failed to generate compliance report' },
      { status: 500 }
    );
  }
});

