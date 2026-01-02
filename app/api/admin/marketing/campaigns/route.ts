/**
 * Admin Marketing Campaigns API
 * GET /api/admin/marketing/campaigns - List marketing campaigns
 * POST /api/admin/marketing/campaigns - Create a new campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['promo', 'referral', 'seo', 'email', 'social']),
  status: z.enum(['draft', 'active', 'paused', 'completed']).default('draft'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().min(0).optional(),
  targetAudience: z.string().optional(),
  description: z.string().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/admin/marketing/campaigns');

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

  // Get query params
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';
  const type = searchParams.get('type') || 'all';

  try {
    // For now, return sample campaign data
    // In production, this would query a campaigns table
    const campaigns = [
      {
        id: '1',
        name: 'Promo Lebaran 2026',
        type: 'promo',
        status: 'active',
        startDate: '2026-03-01',
        endDate: '2026-04-15',
        budget: 5000000,
        spent: 2500000,
        conversions: 45,
        revenue: 112500000,
        roi: 4400,
      },
      {
        id: '2',
        name: 'Referral Program Q1',
        type: 'referral',
        status: 'active',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        budget: 10000000,
        spent: 3200000,
        conversions: 128,
        revenue: 64000000,
        roi: 1900,
      },
      {
        id: '3',
        name: 'SEO Landing Pages',
        type: 'seo',
        status: 'active',
        startDate: '2025-12-01',
        endDate: null,
        budget: 0,
        spent: 0,
        conversions: 89,
        revenue: 44500000,
        roi: null,
      },
      {
        id: '4',
        name: 'Email Retention',
        type: 'email',
        status: 'paused',
        startDate: '2025-11-15',
        endDate: '2026-02-28',
        budget: 2000000,
        spent: 800000,
        conversions: 23,
        revenue: 11500000,
        roi: 1337,
      },
    ];

    // Filter by status
    let filteredCampaigns = campaigns;
    if (status !== 'all') {
      filteredCampaigns = filteredCampaigns.filter((c) => c.status === status);
    }
    if (type !== 'all') {
      filteredCampaigns = filteredCampaigns.filter((c) => c.type === type);
    }

    // Calculate summary stats
    const summary = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      totalBudget: campaigns.reduce((sum, c) => sum + c.budget, 0),
      totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
      totalConversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
      totalRevenue: campaigns.reduce((sum, c) => sum + c.revenue, 0),
    };

    return NextResponse.json({
      campaigns: filteredCampaigns,
      summary,
    });
  } catch (error) {
    logger.error('Marketing campaigns error', error);
    throw error;
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  logger.info('POST /api/admin/marketing/campaigns');

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
  const parsed = createCampaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // In production, this would insert into a campaigns table
  logger.info('Campaign created', { userId: user.id, campaign: parsed.data });

  return NextResponse.json({
    success: true,
    id: crypto.randomUUID(),
    message: 'Campaign created successfully',
  });
});

