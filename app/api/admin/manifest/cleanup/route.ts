/**
 * API: Manifest Cleanup
 * POST /api/admin/manifest/cleanup - Cleanup manifest data (H+72) and IndexedDB
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json()) as {
    tripId?: string;
    clearIndexedDB?: boolean;
  };

  const client = supabase as unknown as any;

  try {
    if (body.tripId) {
      // Cleanup specific trip
      const { data: result, error } = await client.rpc('auto_delete_manifest_data');
      
      if (error) {
        logger.error('Failed to cleanup manifest data', error);
        return NextResponse.json({ error: 'Failed to cleanup manifest data' }, { status: 500 });
      }

      // If clearIndexedDB is requested, return instruction for client-side cleanup
      if (body.clearIndexedDB) {
        return NextResponse.json({
          success: true,
          message: 'Manifest data deleted. IndexedDB cleanup should be done client-side.',
          tripId: body.tripId,
          clearIndexedDB: true,
        });
      }

      return NextResponse.json({
        success: true,
        deleted: result?.deleted_count || 0,
        tripsProcessed: result?.trips_processed || 0,
      });
    } else {
      // Cleanup all eligible trips (H+72)
      const { data: result, error } = await client.rpc('auto_delete_manifest_data');
      
      if (error) {
        logger.error('Failed to cleanup manifest data', error);
        return NextResponse.json({ error: 'Failed to cleanup manifest data' }, { status: 500 });
      }

      logger.info('Manifest cleanup completed', {
        deleted: result?.deleted_count || 0,
        tripsProcessed: result?.trips_processed || 0,
      });

      return NextResponse.json({
        success: true,
        deleted: result?.deleted_count || 0,
        tripsProcessed: result?.trips_processed || 0,
      });
    }
  } catch (error) {
    logger.error('Manifest cleanup error', error);
    return NextResponse.json({ error: 'Failed to cleanup manifest data' }, { status: 500 });
  }
});

/**
 * GET /api/admin/manifest/cleanup - Get cleanup status
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = supabase as unknown as any;

  // Get recent cleanup logs
  const { data: logs, error } = await client
    .from('data_retention_logs')
    .select('*')
    .eq('table_name', 'trip_manifest')
    .order('deleted_at', { ascending: false })
    .limit(50);

  if (error) {
    logger.error('Failed to fetch cleanup logs', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    logs: logs || [],
  });
});

