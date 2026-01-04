/**
 * Inventory Audit (Stock Opname) API
 * GET /api/admin/inventory/audit - List audit records
 * POST /api/admin/inventory/audit - Create stock opname session
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { adjustStock } from '@/lib/inventory';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const auditItemSchema = z.object({
  inventoryId: z.string().uuid(),
  actualStock: z.number().min(0),
  notes: z.string().optional(),
});

const createAuditSchema = z.object({
  items: z.array(auditItemSchema).min(1, 'At least one item is required'),
  sessionNotes: z.string().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/admin/inventory/audit');

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

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Get audit transactions (adjustments)
  const { data: audits, error, count } = await supabase
    .from('inventory_transactions')
    .select(
      `
      id,
      inventory_id,
      quantity,
      stock_before,
      stock_after,
      notes,
      created_at,
      created_by,
      inventory:inventory(name, unit, sku),
      created_by_user:users(full_name)
    `,
      { count: 'exact' }
    )
    .eq('transaction_type', 'adjustment')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Failed to fetch audit records', error);
    return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 });
  }

  const transformedAudits = (audits || []).map((audit) => {
    const inv = audit.inventory as { name: string; unit: string; sku: string | null } | null;
    const createdByUser = audit.created_by_user as { full_name: string | null } | null;
    const variance = Number(audit.stock_after) - Number(audit.stock_before);
    const variancePercent =
      Number(audit.stock_before) > 0
        ? (variance / Number(audit.stock_before)) * 100
        : 0;

    return {
      id: audit.id,
      inventoryId: audit.inventory_id,
      itemName: inv?.name || 'Unknown',
      itemUnit: inv?.unit || 'pcs',
      itemSku: inv?.sku,
      stockBefore: Number(audit.stock_before),
      stockAfter: Number(audit.stock_after),
      variance,
      variancePercent,
      isAnomaly: Math.abs(variancePercent) > 10,
      notes: audit.notes,
      createdAt: audit.created_at,
      createdBy: createdByUser?.full_name || 'System',
    };
  });

  return NextResponse.json({
    audits: transformedAudits,
    pagination: {
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    },
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  logger.info('POST /api/admin/inventory/audit');

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
  const parsed = createAuditSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { items, sessionNotes } = parsed.data;
  const results: Array<{
    inventoryId: string;
    success: boolean;
    variance: number;
    message: string;
  }> = [];

  let totalAnomalies = 0;

  for (const item of items) {
    const reason = sessionNotes
      ? `Stock Opname - ${sessionNotes}${item.notes ? `: ${item.notes}` : ''}`
      : `Stock Opname${item.notes ? `: ${item.notes}` : ''}`;

    const result = await adjustStock(
      item.inventoryId,
      item.actualStock,
      reason,
      user.id
    );

    results.push({
      inventoryId: item.inventoryId,
      success: result.success,
      variance: result.variance,
      message: result.message,
    });

    // Check for anomaly (>10% variance)
    const { data: invData } = await supabase
      .from('inventory')
      .select('current_stock')
      .eq('id', item.inventoryId)
      .single();

    if (invData) {
      const variancePercent =
        Number(invData.current_stock) > 0
          ? (Math.abs(result.variance) / Number(invData.current_stock)) * 100
          : 0;
      if (variancePercent > 10) {
        totalAnomalies++;
      }
    }
  }

  const successCount = results.filter((r) => r.success).length;

  logger.info('Stock opname completed', {
    userId: user.id,
    itemCount: items.length,
    successCount,
    anomalies: totalAnomalies,
  });

  return NextResponse.json({
    success: true,
    message: `Stock opname selesai. ${successCount}/${items.length} item berhasil diproses.`,
    results,
    summary: {
      totalItems: items.length,
      successCount,
      failedCount: items.length - successCount,
      anomalyCount: totalAnomalies,
    },
  });
});

