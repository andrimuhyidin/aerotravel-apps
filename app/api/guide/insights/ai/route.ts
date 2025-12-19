/**
 * API: AI-Powered Insights & Recommendations
 * GET /api/guide/insights/ai
 * 
 * Uses Google Gemini AI to provide:
 * - Income predictions
 * - Performance recommendations
 * - Trip suggestions
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
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

  const branchContext = await getBranchContext(user.id);

  try {
    // Get guide stats - split into separate queries to avoid deep type instantiation
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', user.id)
      .single();

    if (userError) {
      logger.error('Failed to fetch user data for AI insights', userError, { guideId: user.id });
      throw new Error('Failed to fetch user data');
    }

    // Get trips separately
    const { data: tripsData } = await supabase
      .from('trip_guides')
      .select(`
        trip:trips(
          id,
          trip_date,
          status,
          total_pax
        )
      `)
      .eq('guide_id', user.id);

    // Get reviews separately
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('guide_rating, overall_rating')
      .eq('guide_id', user.id);

    // Get wallet separately
    const { data: walletData } = await supabase
      .from('guide_wallets')
      .select('balance')
      .eq('guide_id', user.id)
      .maybeSingle();

    // Combine into stats-like structure
    const stats = {
      id: userData?.id,
      full_name: userData?.full_name,
      trips: tripsData || [],
      reviews: reviewsData || [],
      wallet: walletData || null,
    };


    // Get recent trips
    const { data: recentTrips, error: tripsError } = await supabase
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

    if (tripsError) {
      logger.warn('Failed to fetch recent trips for AI insights', { guideId: user.id, error: tripsError });
    }

    // Get wallet transactions
    const { data: wallet, error: walletError } = await supabase
      .from('guide_wallets')
      .select('id, balance')
      .eq('guide_id', user.id)
      .maybeSingle();

    if (walletError) {
      logger.warn('Failed to fetch wallet for AI insights', { guideId: user.id, error: walletError });
    }

    let transactions: Array<{ amount: number; transaction_type: string; created_at: string }> = [];
    if (wallet) {
      const { data: txData, error: txError } = await supabase
        .from('guide_wallet_transactions')
        .select('transaction_type, amount, created_at')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (txError) {
        logger.warn('Failed to fetch wallet transactions for AI insights', { guideId: user.id, walletId: wallet.id, error: txError });
      } else {
        transactions = (txData || []) as Array<{ amount: number; transaction_type: string; created_at: string }>;
      }
    }

    // Calculate metrics
    const completedTrips = (recentTrips || []).filter(
      (t: { trip: { status: string } }) => t.trip?.status === 'completed'
    ).length;

    const totalEarnings = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const reviews = (stats?.reviews || []) as Array<{ guide_rating?: number | null }>;
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: { guide_rating?: number | null }) => sum + (r.guide_rating || 0), 0) / reviews.length
      : 0;

    // Build context for AI
    const context = {
      guideName: stats?.full_name || 'Guide',
      completedTrips,
      totalEarnings: Math.round(totalEarnings),
      averageRating: Math.round(avgRating * 10) / 10,
      currentBalance: Math.round(Number(walletData?.balance || wallet?.balance || 0)),
      recentTripsCount: recentTrips?.length || 0,
    };

    // Generate AI insights
    const prompt = `You are an AI assistant helping a tour guide improve their performance and earnings.

Guide Statistics:
- Name: ${context.guideName}
- Completed Trips: ${context.completedTrips}
- Total Earnings: Rp ${context.totalEarnings.toLocaleString('id-ID')}
- Average Rating: ${context.averageRating}/5.0
- Current Wallet Balance: Rp ${context.currentBalance.toLocaleString('id-ID')}
- Recent Trips: ${context.recentTripsCount}

Provide insights in JSON format:
{
  "income_prediction": {
    "next_month": number (predicted earnings in IDR),
    "next_3_months": number,
    "confidence": "high" | "medium" | "low",
    "reasoning": "brief explanation"
  },
  "recommendations": [
    {
      "type": "performance" | "earning" | "safety" | "customer_service",
      "title": "recommendation title",
      "description": "detailed recommendation",
      "priority": "high" | "medium" | "low"
    }
  ],
  "trip_suggestions": [
    {
      "suggestion": "what to focus on",
      "reason": "why this helps"
    }
  ],
  "performance_insights": {
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["area 1", "area 2"],
    "trend": "improving" | "stable" | "declining"
  }
}

Return ONLY the JSON object, no additional text.`;

    let aiResponse: string;
    try {
      aiResponse = await generateContent(prompt);
    } catch (aiError) {
      logger.error('Failed to generate AI content', aiError, { guideId: user.id });
      // Return fallback insights if AI generation fails
      const fallbackInsights = {
        income_prediction: {
          next_month: Math.round(context.totalEarnings * 0.8),
          next_3_months: Math.round(context.totalEarnings * 2.5),
          confidence: 'medium' as const,
          reasoning: 'Based on historical data',
        },
        recommendations: [],
        trip_suggestions: [],
        performance_insights: {
          strengths: [],
          improvements: [],
          trend: 'stable' as const,
        },
      };
      return NextResponse.json({
        insights: fallbackInsights,
        context,
      });
    }

    // Parse AI response
    let insights: Record<string, unknown>;
    try {
      const cleaned = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      insights = JSON.parse(cleaned);
      
      // Validate insights structure
      if (!insights || typeof insights !== 'object') {
        throw new Error('Invalid AI response structure');
      }
    } catch (parseError) {
      logger.error('Failed to parse AI insights', parseError, { 
        guideId: user.id,
        aiResponse: aiResponse.substring(0, 200), // Log first 200 chars for debugging
      });
      // Return fallback insights
      insights = {
        income_prediction: {
          next_month: Math.round(context.totalEarnings * 0.8),
          next_3_months: Math.round(context.totalEarnings * 2.5),
          confidence: 'medium',
          reasoning: 'Based on historical data',
        },
        recommendations: [],
        trip_suggestions: [],
        performance_insights: {
          strengths: [],
          improvements: [],
          trend: 'stable',
        },
      };
    }

    return NextResponse.json({
      insights,
      context,
    });
  } catch (error) {
    logger.error('Failed to generate AI insights', error, { guideId: user.id });
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
});

