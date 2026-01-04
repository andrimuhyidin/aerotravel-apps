/**
 * API: Training Compliance Report
 * GET /api/admin/compliance/training - Get training compliance report
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
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

  // Check admin role
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'ops_admin'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get('branchId');
  const trainingType = searchParams.get('trainingType');

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get all training records
  const query = client
    .from('guide_training_records')
    .select(
      `
      id,
      guide_id,
      training_type,
      training_name,
      completion_date,
      expiry_date,
      status,
      certificate_url,
      guide:users!guide_training_records_guide_id_fkey(
        id,
        full_name,
        email
      )
    `
    )
    .order('completion_date', { ascending: false });

  if (branchId) {
    query.eq('branch_id', branchId);
  } else if (branchContext.branchId && !branchContext.isSuperAdmin) {
    query.eq('branch_id', branchContext.branchId);
  }

  if (trainingType) {
    query.eq('training_type', trainingType);
  }

  const { data: trainings, error } = await query;

  if (error) {
    logger.error('Failed to fetch training records', error);
    return NextResponse.json({ error: 'Failed to fetch training records' }, { status: 500 });
  }

  // Calculate compliance stats
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const stats = {
    total: trainings?.length || 0,
    completed: 0,
    inProgress: 0,
    expired: 0,
    expiringSoon: 0,
  };

  const complianceData = (trainings || []).map((training: any) => {
    const expiryDate = training.expiry_date ? new Date(training.expiry_date) : null;
    let complianceStatus: 'completed' | 'in_progress' | 'expired' | 'expiring_soon' = 'completed';

    if (training.status === 'in_progress') {
      complianceStatus = 'in_progress';
      stats.inProgress++;
    } else if (expiryDate) {
      if (expiryDate < now) {
        complianceStatus = 'expired';
        stats.expired++;
      } else if (expiryDate <= thirtyDaysFromNow) {
        complianceStatus = 'expiring_soon';
        stats.expiringSoon++;
      } else {
        stats.completed++;
      }
    } else {
      stats.completed++;
    }

    return {
      id: training.id,
      guideId: training.guide_id,
      guideName: training.guide?.full_name || 'Unknown',
      guideEmail: training.guide?.email || null,
      trainingType: training.training_type,
      trainingName: training.training_name,
      completionDate: training.completion_date,
      expiryDate: training.expiry_date,
      status: training.status,
      complianceStatus,
      daysUntilExpiry: expiryDate
        ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null,
      hasCertificate: !!training.certificate_url,
    };
  });

  return NextResponse.json({
    stats,
    trainings: complianceData,
    generatedAt: new Date().toISOString(),
  });
});

