/**
 * Admin Asset Detail API
 * GET /api/admin/assets/[id] - Get asset details
 * PUT /api/admin/assets/[id] - Update asset
 * DELETE /api/admin/assets/[id] - Delete asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateAssetSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['boat', 'villa', 'vehicle', 'equipment', 'other']).optional(),
  status: z.enum(['available', 'in_use', 'maintenance', 'retired']).optional(),
  capacity: z.number().min(1).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const id = request.url.split('/').pop();
  logger.info(`GET /api/admin/assets/${id}`);

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Sample asset detail
  const asset = {
    id,
    name: 'KM Pahawang Jaya',
    type: 'boat',
    status: 'available',
    capacity: 20,
    location: 'Pelabuhan Ketapang',
    notes: 'Kapal utama rute Pahawang',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-12-01T00:00:00Z',
    maintenanceHistory: [
      {
        id: 'm1',
        startDate: '2025-10-01',
        endDate: '2025-10-07',
        reason: 'Service rutin',
        status: 'completed',
        cost: 5000000,
      },
      {
        id: 'm2',
        startDate: '2025-06-15',
        endDate: '2025-06-20',
        reason: 'Perbaikan body',
        status: 'completed',
        cost: 15000000,
      },
    ],
    usageHistory: [
      {
        id: 'u1',
        tripCode: 'TRIP-2025-100',
        date: '2025-12-28',
        paxCount: 15,
      },
      {
        id: 'u2',
        tripCode: 'TRIP-2025-099',
        date: '2025-12-21',
        paxCount: 18,
      },
    ],
  };

  return NextResponse.json({ asset });
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const id = request.url.split('/').pop();
  logger.info(`PUT /api/admin/assets/${id}`);

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateAssetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  logger.info('Asset updated', { userId: user.id, assetId: id, updates: parsed.data });

  return NextResponse.json({
    success: true,
    message: 'Asset updated successfully',
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const id = request.url.split('/').pop();
  logger.info(`DELETE /api/admin/assets/${id}`);

  const allowed = await hasRole(['super_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('Asset deleted', { userId: user.id, assetId: id });

  return NextResponse.json({
    success: true,
    message: 'Asset deleted successfully',
  });
});

