/**
 * Admin Marketing Promos API
 * GET /api/admin/marketing/promos - List promo codes
 * POST /api/admin/marketing/promos - Create a new promo code
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createPromoSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20),
  name: z.string().min(1, 'Name is required'),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(0),
  minPurchase: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().min(1).optional(),
  perUserLimit: z.number().min(1).default(1),
  startDate: z.string(),
  endDate: z.string(),
  applicableTo: z.enum(['all', 'new_customers', 'vip', 'specific_packages']).default('all'),
  packageIds: z.array(z.string()).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/admin/marketing/promos');

  const allowed = await hasRole(['super_admin', 'marketing']);
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
  const status = searchParams.get('status') || 'all';

  try {
    // Sample promo data - in production, query from promos table
    const promos = [
      {
        id: '1',
        code: 'LEBARAN2026',
        name: 'Diskon Lebaran',
        discountType: 'percentage',
        discountValue: 15,
        minPurchase: 1000000,
        maxDiscount: 500000,
        usageLimit: 100,
        usedCount: 45,
        perUserLimit: 1,
        startDate: '2026-03-01',
        endDate: '2026-04-15',
        status: 'active',
        applicableTo: 'all',
      },
      {
        id: '2',
        code: 'NEWUSER50K',
        name: 'Diskon Pengguna Baru',
        discountType: 'fixed',
        discountValue: 50000,
        minPurchase: 500000,
        maxDiscount: null,
        usageLimit: null,
        usedCount: 234,
        perUserLimit: 1,
        startDate: '2025-01-01',
        endDate: '2026-12-31',
        status: 'active',
        applicableTo: 'new_customers',
      },
      {
        id: '3',
        code: 'VIP20',
        name: 'VIP Exclusive',
        discountType: 'percentage',
        discountValue: 20,
        minPurchase: 2000000,
        maxDiscount: 1000000,
        usageLimit: 50,
        usedCount: 50,
        perUserLimit: 2,
        startDate: '2025-12-01',
        endDate: '2026-01-31',
        status: 'expired',
        applicableTo: 'vip',
      },
    ];

    // Determine status based on dates and usage
    const now = new Date();
    const processedPromos = promos.map((promo) => {
      const endDate = new Date(promo.endDate);
      const startDate = new Date(promo.startDate);
      
      let computedStatus = promo.status;
      if (endDate < now) {
        computedStatus = 'expired';
      } else if (startDate > now) {
        computedStatus = 'scheduled';
      } else if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
        computedStatus = 'exhausted';
      }

      return {
        ...promo,
        status: computedStatus,
        remainingUsage: promo.usageLimit ? promo.usageLimit - promo.usedCount : null,
      };
    });

    // Filter by status
    let filteredPromos = processedPromos;
    if (status !== 'all') {
      filteredPromos = processedPromos.filter((p) => p.status === status);
    }

    // Summary stats
    const summary = {
      totalPromos: promos.length,
      activePromos: processedPromos.filter((p) => p.status === 'active').length,
      totalUsed: promos.reduce((sum, p) => sum + p.usedCount, 0),
      expiredPromos: processedPromos.filter((p) => p.status === 'expired').length,
    };

    return NextResponse.json({
      promos: filteredPromos,
      summary,
    });
  } catch (error) {
    logger.error('Marketing promos error', error);
    throw error;
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  logger.info('POST /api/admin/marketing/promos');

  const allowed = await hasRole(['super_admin', 'marketing']);
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
  const parsed = createPromoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // In production, insert into promos table
  logger.info('Promo created', { userId: user.id, promo: parsed.data });

  return NextResponse.json({
    success: true,
    id: crypto.randomUUID(),
    message: 'Promo code created successfully',
  });
});

