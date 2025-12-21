/**
 * API: Training Expiry Alerts
 * POST /api/admin/training/expiry-alerts - Manually trigger expiry check (for testing)
 * 
 * Note: The actual alerts are sent via pg_cron job daily at 9 AM
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();

  // Only admin can trigger manually
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Call the SQL function (function is created in migration, may not be in types yet)
    const { data, error } = await (supabase as any).rpc('check_expiring_certifications');

    if (error) {
      logger.error('Failed to check expiring certifications', error);
      return NextResponse.json(
        { error: 'Failed to check expiring certifications', details: error.message },
        { status: 500 }
      );
    }

    logger.info('Expiry alerts check completed', { data });

    return NextResponse.json({
      success: true,
      message: 'Expiry alerts check completed. Check notification_logs for results.',
    });
  } catch (error) {
    logger.error('Error checking expiring certifications', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

