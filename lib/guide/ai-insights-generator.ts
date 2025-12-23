/**
 * Centralized AI Insights Generator
 * Single source of truth for all AI-generated insights
 * Consolidates logic from multiple redundant endpoints
 */

import 'server-only';

import {
  generateCoachingPlan,
  type PerformanceData,
} from '@/lib/ai/performance-coach';
import { generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';
import type { UnifiedMetrics } from '@/types/guide-metrics';
import type {
  AIInsightsGenerationOptions,
  UnifiedAIInsights,
} from '@/types/ai-insights';

/**
 * Generate unified AI insights
 */
export async function generateUnifiedAIInsights(
  metrics: UnifiedMetrics,
  context: GuideContext,
  options: AIInsightsGenerationOptions = {}
): Promise<UnifiedAIInsights> {
  const include = options.include || [
    'performance',
    'recommendations',
    'predictions',
  ];
  const includeCoaching = options.includeCoaching ?? false;

  try {
    // Build comprehensive prompt for all insights
    const prompt = buildComprehensivePrompt(metrics, context);

    // Generate all insights in single AI call
    let aiResponse: string;
    try {
      aiResponse = await generateContent(prompt);
    } catch (aiError) {
      logger.error('Failed to generate AI insights', aiError, {
        guideId: context.guideId,
      });
      return getFallbackInsights(metrics, context);
    }

    // Parse AI response
    let parsedInsights: any;
    try {
      const cleaned = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      parsedInsights = JSON.parse(cleaned);
    } catch (parseError) {
      logger.error('Failed to parse AI insights', parseError, {
        guideId: context.guideId,
        aiResponse: aiResponse.substring(0, 200),
      });
      return getFallbackInsights(metrics, context);
    }

    // Structure unified insights
    const insights: UnifiedAIInsights = {
      performance: {
        strengths:
          parsedInsights.performance_insights?.strengths ||
          parsedInsights.strengths ||
          [],
        weaknesses:
          parsedInsights.performance_insights?.improvements ||
          parsedInsights.weaknesses ||
          [],
        trend:
          parsedInsights.performance_insights?.trend ||
          parsedInsights.trend ||
          'stable',
        summary: parsedInsights.summary || undefined,
      },
      recommendations: [],
      predictions: {
        income: {
          nextMonth: parsedInsights.income_prediction?.next_month || 0,
          next3Months: parsedInsights.income_prediction?.next_3_months || 0,
          confidence: parsedInsights.income_prediction?.confidence || 'medium',
          reasoning:
            parsedInsights.income_prediction?.reasoning ||
            'Based on historical data',
        },
        performance: {
          trend:
            parsedInsights.performance_insights?.trend ||
            parsedInsights.trend ||
            'stable',
          expectedScore: parsedInsights.expected_score || undefined,
        },
      },
    };

    // Process recommendations from multiple sources
    const recommendations: UnifiedAIInsights['recommendations'] = [];

    // From performance insights
    if (
      parsedInsights.recommendations &&
      Array.isArray(parsedInsights.recommendations)
    ) {
      for (const rec of parsedInsights.recommendations) {
        if (typeof rec === 'string') {
          // Simple string recommendation
          recommendations.push({
            id: `rec-${recommendations.length}`,
            type: 'performance',
            title: rec,
            description: rec,
            priority: 'medium',
            source: 'insights',
          });
        } else if (rec.title || rec.description) {
          // Structured recommendation
          recommendations.push({
            id: `rec-${recommendations.length}`,
            type: rec.type || 'performance',
            title: rec.title || rec.description || 'Recommendation',
            description: rec.description || rec.title || '',
            priority: rec.priority || 'medium',
            source: 'insights',
            category: rec.category,
          });
        }
      }
    }

    // Deduplicate recommendations
    insights.recommendations = deduplicateRecommendations(recommendations);

    // Generate coaching insights if requested
    if (
      includeCoaching &&
      (include.includes('coaching') || include.length === 0)
    ) {
      const coachingData = await generateCoachingData(metrics, context);
      insights.coaching = coachingData;
    }

    return insights;
  } catch (error) {
    logger.error('Failed to generate unified AI insights', error, {
      guideId: context.guideId,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return getFallbackInsights(metrics, context);
  }
}

/**
 * Build comprehensive prompt for all insights
 */
function buildComprehensivePrompt(
  metrics: UnifiedMetrics,
  context: GuideContext
): string {
  const customerSatisfaction = metrics.customerSatisfaction
    ? `
Customer Satisfaction:
- Response Rate: ${metrics.customerSatisfaction.responseRate !== null ? `${metrics.customerSatisfaction.responseRate.toFixed(0)}%` : 'N/A'}
- Repeat Customer Rate: ${metrics.customerSatisfaction.repeatCustomerRate !== null ? `${metrics.customerSatisfaction.repeatCustomerRate.toFixed(0)}%` : 'N/A'}
- Complaint Resolution Rate: ${metrics.customerSatisfaction.complaintResolutionRate !== null ? `${metrics.customerSatisfaction.complaintResolutionRate.toFixed(0)}%` : 'N/A'}
- Satisfaction Score: ${metrics.customerSatisfaction.satisfactionScore !== null ? metrics.customerSatisfaction.satisfactionScore.toFixed(1) : 'N/A'}/5.0`
    : '';

  const efficiency = metrics.efficiency
    ? `
Efficiency Metrics:
- Average Trip Duration: ${metrics.efficiency.avgTripDuration !== null ? `${metrics.efficiency.avgTripDuration.toFixed(1)} hours` : 'N/A'}
- Guest-to-Trip Ratio: ${metrics.efficiency.guestToTripRatio !== null ? metrics.efficiency.guestToTripRatio.toFixed(1) : 'N/A'}
- Revenue per Guest: ${metrics.efficiency.revenuePerGuest !== null ? `Rp ${Math.round(metrics.efficiency.revenuePerGuest).toLocaleString('id-ID')}` : 'N/A'}
- Utilization Rate: ${metrics.efficiency.utilizationRate !== null ? `${metrics.efficiency.utilizationRate.toFixed(0)}%` : 'N/A'}
- Avg Response Time: ${metrics.efficiency.avgResponseTime !== null ? `${metrics.efficiency.avgResponseTime.toFixed(1)} hours` : 'N/A'}`
    : '';

  const financial = metrics.financial
    ? `
Financial Metrics:
- Net Earnings: Rp ${Math.round(metrics.financial.netEarnings).toLocaleString('id-ID')}
- Penalty Impact: ${metrics.financial.penaltyImpact.toFixed(1)}%
- Savings Rate: ${metrics.financial.savingsRate !== null ? `${metrics.financial.savingsRate.toFixed(0)}%` : 'N/A'}
- Withdrawal Frequency: ${metrics.financial.withdrawalFrequency} times/month`
    : '';

  const quality = metrics.quality
    ? `
Quality Metrics:
- On-Time Completion Rate: ${metrics.quality.onTimeCompletionRate !== null ? `${metrics.quality.onTimeCompletionRate.toFixed(0)}%` : 'N/A'}
- No-Show Rate: ${metrics.quality.noShowRate !== null ? `${metrics.quality.noShowRate.toFixed(0)}%` : 'N/A'}
- Documentation Completion Rate: ${metrics.quality.documentationCompletionRate !== null ? `${metrics.quality.documentationCompletionRate.toFixed(0)}%` : 'N/A'}
- Late Check-in Rate: ${metrics.quality.lateCheckInRate !== null ? `${metrics.quality.lateCheckInRate.toFixed(0)}%` : 'N/A'}`
    : '';

  const growth = metrics.growth
    ? `
Growth Metrics:
- MoM Trips Growth: ${metrics.growth.momGrowth.trips !== null ? `${metrics.growth.momGrowth.trips > 0 ? '+' : ''}${metrics.growth.momGrowth.trips.toFixed(1)}%` : 'N/A'}
- MoM Earnings Growth: ${metrics.growth.momGrowth.earnings !== null ? `${metrics.growth.momGrowth.earnings > 0 ? '+' : ''}${metrics.growth.momGrowth.earnings.toFixed(1)}%` : 'N/A'}
- MoM Ratings Growth: ${metrics.growth.momGrowth.ratings !== null ? `${metrics.growth.momGrowth.ratings > 0 ? '+' : ''}${metrics.growth.momGrowth.ratings.toFixed(1)}%` : 'N/A'}
- Skill Progression Rate: ${metrics.growth.skillProgressionRate !== null ? `${metrics.growth.skillProgressionRate > 0 ? '+' : ''}${metrics.growth.skillProgressionRate.toFixed(1)}%` : 'N/A'}
- Certification Completion: ${metrics.growth.certificationCompletionRate !== null ? `${metrics.growth.certificationCompletionRate.toFixed(0)}%` : 'N/A'}`
    : '';

  const comparative = metrics.comparative
    ? `
Comparative Metrics:
- Peer Ranking: ${metrics.comparative.peerRanking !== null ? `#${Math.round(metrics.comparative.peerRanking)}` : 'N/A'}
- Top Performer Gap (Trips): ${metrics.comparative.topPerformerGap.trips !== null ? `${metrics.comparative.topPerformerGap.trips.toFixed(1)}%` : 'N/A'}
- Top Performer Gap (Earnings): ${metrics.comparative.topPerformerGap.earnings !== null ? `${metrics.comparative.topPerformerGap.earnings.toFixed(1)}%` : 'N/A'}
- Market Share: ${metrics.comparative.marketShare !== null ? `${metrics.comparative.marketShare.toFixed(1)}%` : 'N/A'}`
    : '';

  const sustainability = metrics.sustainability
    ? `
Sustainability Metrics:
- Total Waste: ${metrics.sustainability.totalWasteKg.toFixed(1)} kg
- Waste by Type: Plastic ${metrics.sustainability.wasteByType.plastic.toFixed(1)}kg, Organic ${metrics.sustainability.wasteByType.organic.toFixed(1)}kg, Glass ${metrics.sustainability.wasteByType.glass.toFixed(1)}kg, Hazmat ${metrics.sustainability.wasteByType.hazmat.toFixed(1)}kg
- Recycling Rate: ${metrics.sustainability.recyclingRate !== null ? `${metrics.sustainability.recyclingRate.toFixed(0)}%` : 'N/A'}
- Carbon Footprint: ${metrics.sustainability.carbonFootprintKg.toFixed(1)} kg CO₂
- Carbon per Guest: ${metrics.sustainability.carbonPerGuest !== null ? `${metrics.sustainability.carbonPerGuest.toFixed(2)} kg CO₂` : 'N/A'}
- Sustainability Score: ${metrics.sustainability.sustainabilityScore !== null ? `${metrics.sustainability.sustainabilityScore}/100` : 'N/A'}
- Waste Reduction Trend: ${metrics.sustainability.wasteReductionTrend !== null ? `${metrics.sustainability.wasteReductionTrend > 0 ? '+' : ''}${metrics.sustainability.wasteReductionTrend.toFixed(1)}%` : 'N/A'}`
    : '';

  const operations = metrics.operations
    ? `
Operations Metrics:
- Equipment Checklist Rate: ${metrics.operations.equipmentChecklistRate !== null ? `${metrics.operations.equipmentChecklistRate.toFixed(0)}%` : 'N/A'}
- Risk Assessment Rate: ${metrics.operations.riskAssessmentRate !== null ? `${metrics.operations.riskAssessmentRate.toFixed(0)}%` : 'N/A'}
- Documentation Upload Rate: ${metrics.operations.documentationUploadRate !== null ? `${metrics.operations.documentationUploadRate.toFixed(0)}%` : 'N/A'}
- Expense Submission Rate: ${metrics.operations.expenseSubmissionRate !== null ? `${metrics.operations.expenseSubmissionRate.toFixed(0)}%` : 'N/A'}
- Task Completion Rate: ${metrics.operations.taskCompletionRate !== null ? `${metrics.operations.taskCompletionRate.toFixed(0)}%` : 'N/A'}
- Attendance Compliance Rate: ${metrics.operations.attendanceComplianceRate !== null ? `${metrics.operations.attendanceComplianceRate.toFixed(0)}%` : 'N/A'}
- Logistics Handover Rate: ${metrics.operations.logisticsHandoverRate !== null ? `${metrics.operations.logisticsHandoverRate.toFixed(0)}%` : 'N/A'}`
    : '';

  const safety = metrics.safety
    ? `
Safety Metrics:
- Incident Frequency: ${metrics.safety.incidentFrequency.toFixed(1)} per 100 trips
- Risk Assessment Frequency: ${metrics.safety.riskAssessmentFrequency.toFixed(2)} per trip
- Safety Compliance Score: ${metrics.safety.safetyComplianceScore !== null ? `${metrics.safety.safetyComplianceScore}/100` : 'N/A'}
- Pre-Trip Readiness Rate: ${metrics.safety.preTripReadinessRate !== null ? `${metrics.safety.preTripReadinessRate.toFixed(0)}%` : 'N/A'}`
    : '';

  return `You are an AI assistant helping a tour guide improve their performance and earnings.

Guide Statistics:
- Name: ${context.guideName || 'Guide'}
- Completed Trips: ${metrics.trips.completed}
- Total Trips: ${metrics.trips.total}
- Total Earnings: Rp ${(metrics.earnings.total || 0).toLocaleString('id-ID')}
- Average Earnings per Trip: Rp ${(metrics.earnings.average || 0).toLocaleString('id-ID')}
- Average Rating: ${metrics.ratings.average || 'N/A'}/5.0 (${metrics.ratings.total} ratings)
- Overall Performance Score: ${metrics.performance.score || 'N/A'}/100
- Performance Tier: ${metrics.performance.tier || 'N/A'}
- On-Time Rate: ${metrics.performance.onTimeRate !== null ? `${metrics.performance.onTimeRate}%` : 'N/A'}
- Percentile: ${metrics.performance.percentile}%
- Skills Improved: ${metrics.development.skillsImproved}
- Assessments Completed: ${metrics.development.assessmentsCompleted}${customerSatisfaction}${efficiency}${financial}${quality}${growth}${comparative}${sustainability}${operations}${safety}

Provide comprehensive insights in JSON format:
{
  "performance_insights": {
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["area 1", "area 2"],
    "trend": "improving" | "stable" | "declining"
  },
  "income_prediction": {
    "next_month": number (predicted earnings in IDR),
    "next_3_months": number,
    "confidence": "high" | "medium" | "low",
    "reasoning": "brief explanation"
  },
  "recommendations": [
    {
      "type": "performance" | "earning" | "safety" | "customer_service" | "training" | "practice" | "feedback" | "certification",
      "title": "recommendation title",
      "description": "detailed recommendation",
      "priority": "high" | "medium" | "low",
      "category": "optional category"
    }
  ],
  "summary": "brief summary of overall performance and key insights"
}

Return ONLY the JSON object, no additional text.`;
}

/**
 * Generate coaching data
 */
async function generateCoachingData(
  metrics: UnifiedMetrics,
  context: GuideContext
): Promise<UnifiedAIInsights['coaching']> {
  try {
    const performanceData: PerformanceData = {
      guideId: context.guideId,
      completedTrips: metrics.trips.completed,
      averageRating: metrics.ratings.average || 0,
      totalRatings: metrics.ratings.total,
      totalEarnings: metrics.earnings.total,
      skills: context.skills || [],
      recentFeedback: context.recentFeedback || [],
      attendance: {
        onTime: 0,
        late: 0,
        total: 0,
      },
      trends: {
        ratingTrend: metrics.ratings.trend.length > 0 ? 'improving' : 'stable',
        earningsTrend:
          metrics.earnings.trend?.direction === 'up' ? 'increasing' : 'stable',
      },
    };

    const coachingPlan = await generateCoachingPlan(performanceData);

    return {
      actionPlan: coachingPlan.actionPlan,
      skillGaps: coachingPlan.skillGaps,
    };
  } catch (error) {
    logger.error('Failed to generate coaching data', error, {
      guideId: context.guideId,
    });
    return undefined;
  }
}

/**
 * Deduplicate recommendations
 */
function deduplicateRecommendations(
  recommendations: UnifiedAIInsights['recommendations']
): UnifiedAIInsights['recommendations'] {
  const seen = new Map<string, UnifiedAIInsights['recommendations'][0]>();

  for (const rec of recommendations) {
    const key = rec.title.toLowerCase().trim();
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, rec);
    } else {
      // Keep the one with higher priority
      if (
        getPriorityValue(rec.priority) > getPriorityValue(existing.priority)
      ) {
        seen.set(key, rec);
      } else if (
        getPriorityValue(rec.priority) === getPriorityValue(existing.priority)
      ) {
        // If same priority, merge descriptions
        seen.set(key, {
          ...existing,
          description: `${existing.description}\n${rec.description}`,
        });
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Get priority value for sorting
 */
function getPriorityValue(priority: 'high' | 'medium' | 'low'): number {
  switch (priority) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}

/**
 * Get fallback insights when AI generation fails
 */
function getFallbackInsights(
  metrics: UnifiedMetrics,
  context: GuideContext
): UnifiedAIInsights {
  return {
    performance: {
      strengths: [],
      weaknesses: [],
      trend: 'stable',
      summary: 'Belum ada data performa yang cukup untuk analisis',
    },
    recommendations: [
      {
        id: 'fallback-1',
        type: 'performance',
        title: 'Terus tingkatkan kualitas pelayanan',
        description:
          'Fokus pada peningkatan kualitas pelayanan untuk mendapatkan rating yang lebih baik',
        priority: 'medium',
        source: 'insights',
      },
      {
        id: 'fallback-2',
        type: 'earning',
        title: 'Selesaikan lebih banyak trip',
        description: 'Selesaikan lebih banyak trip untuk meningkatkan earnings',
        priority: 'medium',
        source: 'insights',
      },
    ],
    predictions: {
      income: {
        nextMonth: Math.round(metrics.earnings.total * 0.8),
        next3Months: Math.round(metrics.earnings.total * 2.5),
        confidence: 'medium',
        reasoning: 'Based on historical data',
      },
      performance: {
        trend: 'stable',
      },
    },
  };
}

/**
 * Guide context for AI insights generation
 */
export type GuideContext = {
  guideId: string;
  guideName?: string;
  skills?: Array<{
    name: string;
    level: number;
    certified: boolean;
  }>;
  recentFeedback?: Array<{
    rating: number;
    comment: string;
    category: string;
  }>;
};
