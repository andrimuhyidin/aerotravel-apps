/**
 * API: Performance Insights (AI-powered)
 * GET /api/guide/performance/insights
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { generateContent } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get current metrics
    const { data: metrics } = await (supabase as any)
      .from('guide_performance_metrics')
      .select('*')
      .eq('guide_id', user.id)
      .eq('period_type', 'monthly')
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!metrics) {
      return NextResponse.json({
        insights: {
          summary: 'Belum ada data performa yang cukup untuk analisis',
          trends: [],
          recommendations: [],
        },
      });
    }

    // Get recent trips for context
    const { data: recentTrips } = await (supabase as any)
      .from('trip_guides')
      .select(`
        trip:trips(
          trip_code,
          trip_date,
          status,
          total_pax
        ),
        fee_amount
      `)
      .eq('guide_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent reviews
    const { data: recentReviews } = await (supabase as any)
      .from('reviews')
      .select('guide_rating, comment')
      .eq('guide_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build context for AI
    const context = {
      totalTrips: metrics.total_trips,
      completedTrips: metrics.completed_trips,
      averageRating: metrics.average_rating,
      totalRatings: metrics.total_ratings,
      totalEarnings: metrics.total_earnings,
      overallScore: metrics.overall_score,
      performanceTier: metrics.performance_tier,
      recentTripsCount: recentTrips?.length || 0,
      recentReviewsCount: recentReviews?.length || 0,
    };

    // Generate AI insights
    const prompt = `Analyze this tour guide's performance metrics and provide insights:

Performance Metrics:
- Total Trips: ${context.totalTrips}
- Completed Trips: ${context.completedTrips}
- Average Rating: ${context.averageRating || 'N/A'}/5.0 (${context.totalRatings} ratings)
- Total Earnings: Rp ${context.totalEarnings.toLocaleString('id-ID')}
- Overall Score: ${context.overallScore || 'N/A'}/100
- Performance Tier: ${context.performanceTier || 'N/A'}

Provide insights in JSON format:
{
  "summary": "brief summary of overall performance",
  "trends": [
    {
      "metric": "trips",
      "trend": "up" | "down" | "stable",
      "change": number (percentage change)
    }
  ],
  "recommendations": [
    "actionable recommendation 1",
    "actionable recommendation 2"
  ]
}

Return ONLY the JSON object, no additional text.`;

    let insights: Record<string, unknown>;
    try {
      const aiResponse = await generateContent(prompt);
      const cleaned = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      insights = JSON.parse(cleaned);
    } catch (aiError) {
      logger.warn('Failed to generate AI insights', { guideId: user.id, error: aiError });
      // Return fallback insights
      insights = {
        summary: 'Analisis performa berdasarkan data yang tersedia',
        trends: [],
        recommendations: [
          'Terus tingkatkan kualitas pelayanan untuk mendapatkan rating yang lebih baik',
          'Selesaikan lebih banyak trip untuk meningkatkan earnings',
        ],
      };
    }

    return NextResponse.json({
      insights,
    });
  } catch (error) {
    logger.error('Failed to generate performance insights', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
});
