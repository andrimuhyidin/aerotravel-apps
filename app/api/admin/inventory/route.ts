/**
 * Admin Inventory API
 * GET /api/admin/inventory - List inventory items
 * POST /api/admin/inventory - Create new inventory item
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getInventoryItems, createInventoryItem } from '@/lib/inventory';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  currentStock: z.number().min(0).optional(),
  minStock: z.number().min(0).optional(),
  unitCost: z.number().min(0).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/admin/inventory');

  const allowed = await hasRole(['super_admin', 'ops_admin', 'finance_admin']);
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

  // Get user's branch
  const { data: userData } = await supabase
    .from('users')
    .select('branch_id')
    .eq('id', user.id)
    .single();

  const branchId = userData?.branch_id || 'default-branch';

  const items = await getInventoryItems(branchId);

  // Calculate summary stats
  const lowStockCount = items.filter((item) => item.isLowStock).length;
  const totalValue = items.reduce(
    (sum, item) => sum + item.currentStock * item.unitCost,
    0
  );

  return NextResponse.json({
    items,
    summary: {
      totalItems: items.length,
      lowStockCount,
      totalValue,
    },
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  logger.info('POST /api/admin/inventory');

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
  const parsed = createItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Get user's branch
  const { data: userData } = await supabase
    .from('users')
    .select('branch_id')
    .eq('id', user.id)
    .single();

  const branchId = userData?.branch_id || 'default-branch';

  const result = await createInventoryItem(branchId, parsed.data);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    id: result.id,
    message: result.message,
  });
});

