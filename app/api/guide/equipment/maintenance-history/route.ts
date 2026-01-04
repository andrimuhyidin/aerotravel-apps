/**
 * API: Equipment Maintenance History
 * GET /api/guide/equipment/maintenance-history?equipmentId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const equipmentId = searchParams.get('equipmentId');

  if (!equipmentId) {
    return NextResponse.json({ error: 'equipmentId is required' }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // Get asset info
    const { data: asset, error: assetError } = await client
      .from('assets')
      .select('id, code, name, last_maintenance_date, next_maintenance_date')
      .eq('id', equipmentId)
      .eq('branch_id', branchContext.branchId)
      .single();

    if (assetError || !asset) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    // Get maintenance history
    const { data: maintenanceLogs, error: logsError } = await client
      .from('asset_maintenance_logs')
      .select('id, maintenance_type, maintenance_date, description, cost, performed_by, notes')
      .eq('asset_id', equipmentId)
      .order('maintenance_date', { ascending: false })
      .limit(10);

    if (logsError) {
      logger.warn('Failed to fetch maintenance logs', { error: logsError, equipmentId });
    }

    return NextResponse.json({
      equipment: {
        id: asset.id,
        code: asset.code,
        name: asset.name,
        lastMaintenanceDate: asset.last_maintenance_date,
        nextMaintenanceDate: asset.next_maintenance_date,
      },
      history: (maintenanceLogs || []).map((log: any) => ({
        id: log.id,
        type: log.maintenance_type,
        date: log.maintenance_date,
        description: log.description,
        cost: log.cost,
        performedBy: log.performed_by,
        notes: log.notes,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch maintenance history', error, { equipmentId });
    return NextResponse.json({ error: 'Failed to fetch maintenance history' }, { status: 500 });
  }
});

