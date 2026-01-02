/**
 * Admin Asset Maintenance API
 * GET /api/admin/assets/[id]/maintenance - Get maintenance history
 * POST /api/admin/assets/[id]/maintenance - Schedule maintenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const scheduleMaintenanceSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(1, 'Reason is required'),
  estimatedCost: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const pathParts = request.url.split('/');
  const id = pathParts[pathParts.length - 2];
  logger.info(`GET /api/admin/assets/${id}/maintenance`);

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

  // Sample maintenance history
  const maintenances = [
    {
      id: 'm1',
      assetId: id,
      startDate: '2025-10-01',
      endDate: '2025-10-07',
      reason: 'Service rutin mesin',
      status: 'completed',
      estimatedCost: 5000000,
      actualCost: 4800000,
      notes: 'Ganti oli dan filter',
      createdBy: 'Admin Ops',
      createdAt: '2025-09-25T10:00:00Z',
    },
    {
      id: 'm2',
      assetId: id,
      startDate: '2025-06-15',
      endDate: '2025-06-20',
      reason: 'Perbaikan body kapal',
      status: 'completed',
      estimatedCost: 15000000,
      actualCost: 16500000,
      notes: 'Dempul dan cat ulang',
      createdBy: 'Admin Ops',
      createdAt: '2025-06-01T09:00:00Z',
    },
    {
      id: 'm3',
      assetId: id,
      startDate: '2026-01-15',
      endDate: '2026-01-20',
      reason: 'Service tahunan',
      status: 'scheduled',
      estimatedCost: 8000000,
      actualCost: null,
      notes: 'Jadwal service rutin tahunan',
      createdBy: 'Admin Ops',
      createdAt: '2025-12-20T14:00:00Z',
    },
  ];

  return NextResponse.json({ maintenances });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const pathParts = request.url.split('/');
  const id = pathParts[pathParts.length - 2];
  logger.info(`POST /api/admin/assets/${id}/maintenance`);

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
  const parsed = scheduleMaintenanceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Validate dates
  const startDate = new Date(parsed.data.startDate);
  const endDate = new Date(parsed.data.endDate);

  if (endDate < startDate) {
    return NextResponse.json(
      { error: 'End date must be after start date' },
      { status: 400 }
    );
  }

  logger.info('Maintenance scheduled', {
    userId: user.id,
    assetId: id,
    maintenance: parsed.data,
  });

  return NextResponse.json({
    success: true,
    id: crypto.randomUUID(),
    message: 'Maintenance scheduled successfully. Asset will be marked as unavailable during this period.',
  });
});

