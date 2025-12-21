/**
 * API: Admin Manifest Access Audit
 * GET /api/admin/manifest/audit?tripId=xxx - Get access audit log for trip (admin view)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('tripId');

  const client = supabase as unknown as any;

  if (tripId) {
    // Get access logs for specific trip
    const { data: logs, error } = await client
      .from('manifest_access_logs')
      .select(`
        *,
        guide:users!manifest_access_logs_guide_id_fkey(full_name, email),
        trip:trips!manifest_access_logs_trip_id_fkey(trip_code, trip_date)
      `)
      .eq('trip_id', tripId)
      .order('accessed_at', { ascending: false })
      .limit(100);

    if (error) {
      logger.error('Failed to fetch manifest access logs', error, { tripId });
      return NextResponse.json(
        { error: 'Failed to fetch access logs' },
        { status: 500 }
      );
    }

    // Get summary
    const { data: summary } = await client.rpc('get_manifest_access_summary', {
      p_trip_id: tripId,
    });

    return NextResponse.json({
      success: true,
      logs: logs || [],
      summary: summary?.[0] || null,
      count: (logs || []).length,
    });
  } else {
    // Get all recent access logs (last 100)
    const { data: logs, error } = await client
      .from('manifest_access_logs')
      .select(`
        *,
        guide:users!manifest_access_logs_guide_id_fkey(full_name, email),
        trip:trips!manifest_access_logs_trip_id_fkey(trip_code, trip_date)
      `)
      .order('accessed_at', { ascending: false })
      .limit(100);

    if (error) {
      logger.error('Failed to fetch manifest access logs', error);
      return NextResponse.json(
        { error: 'Failed to fetch access logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      count: (logs || []).length,
    });
  }
});

