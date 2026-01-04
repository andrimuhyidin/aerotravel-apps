/**
 * API: AI Sales Insights
 * GET /api/partner/ai/insights
 * BRD 10 - AI Sales Insights
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { generateSalesInsights } from '@/lib/ai/sales-insights';
import { aiChatRateLimit } from '@/lib/integrations/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner } = await verifyPartnerAccess(user.id);
  if (!isPartner) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const searchParams = sanitizeSearchParams(request);
  const period = searchParams.get('period') || '30'; // '7', '30', '90'

  // Rate limiting
  const { success, limit, remaining } = await aiChatRateLimit.limit(user.id);
  if (!success) {
    return NextResponse.json(
      {
        error: 'Terlalu banyak request. Silakan tunggu sebentar.',
        limit,
        remaining,
      },
      { status: 429 }
    );
  }

  try {
    // Get analytics data (reuse existing analytics API logic)
    const analyticsResponse = await fetch(
      `${request.nextUrl.origin}/api/partner/analytics?period=${period}`,
      {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      }
    );

    if (!analyticsResponse.ok) {
      throw new Error('Failed to fetch analytics data');
    }

    const analyticsData = await analyticsResponse.json();

    // Generate insights
    const insights = await generateSalesInsights(analyticsData, user.id);

    logger.info('AI Sales Insights generated', {
      userId: user.id,
      period,
      insightsCount: insights.insights.length,
      recommendationsCount: insights.recommendations.length,
    });

    return NextResponse.json({
      insights,
      remaining,
    });
  } catch (error) {
    logger.error('AI Sales Insights error', error, {
      userId: user.id,
      period,
    });
    throw error;
  }
});

