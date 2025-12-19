/**
 * API: Auto-expire Contracts
 * POST /api/admin/guide/contracts/expire - Manually trigger contract expiration
 * This can be called by cron job or scheduled task
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  // Call the auto-expire function
  const { data, error } = await client.rpc('auto_expire_contracts');

  if (error) {
    logger.error('Failed to auto-expire contracts', error);
    return NextResponse.json({ error: 'Failed to expire contracts' }, { status: 500 });
  }

  // Get count of expired contracts
  const { count } = await client
    .from('guide_contracts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'expired')
    .gte('updated_at', new Date(Date.now() - 60000).toISOString()); // Updated in last minute

  logger.info('Contracts auto-expired', {
    expiredCount: count || 0,
  });

  return NextResponse.json({
    success: true,
    expiredCount: count || 0,
    message: `${count || 0} kontrak telah kadaluarsa`,
  });
});
