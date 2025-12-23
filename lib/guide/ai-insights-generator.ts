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
          // Structured recommendation with predicted impact
          recommendations.push({
            id: `rec-${recommendations.length}`,
            type: rec.type || 'performance',
            title: rec.title || rec.description || 'Recommendation',
            description: rec.description || rec.title || '',
            priority: rec.priority || 'medium',
            source: 'insights',
            category: rec.category,
            predictedImpact: rec.predicted_impact
              ? {
                  earnings: rec.predicted_impact.earnings,
                  rating: rec.predicted_impact.rating,
                  timeframe: rec.predicted_impact.timeframe || '1-2 weeks',
                  confidence: rec.predicted_impact.confidence || 'medium',
                }
              : undefined,
          });
        }
      }
    }

    // Deduplicate recommendations
    insights.recommendations = deduplicateRecommendations(recommendations);

    // Parse risk alerts
    if (
      parsedInsights.risk_alerts &&
      Array.isArray(parsedInsights.risk_alerts)
    ) {
      insights.riskAlerts = parsedInsights.risk_alerts.map(
        (alert: any, idx: number) => ({
          id: `risk-${idx}`,
          type: alert.type || 'operational',
          severity: alert.severity || 'medium',
          title: alert.title || 'Risk Alert',
          description: alert.description || '',
          metric: alert.metric || '',
          currentValue: alert.current_value || '',
          threshold: alert.threshold || '',
          recommendedAction: alert.recommended_action || '',
          impact: alert.impact || '',
        })
      );
    }

    // Parse quick wins
    if (parsedInsights.quick_wins && Array.isArray(parsedInsights.quick_wins)) {
      insights.quickWins = parsedInsights.quick_wins.map(
        (win: any, idx: number) => ({
          id: `quickwin-${idx}`,
          title: win.title || 'Quick Win',
          description: win.description || '',
          estimatedImpact: {
            earnings: win.estimated_impact?.earnings,
            rating: win.estimated_impact?.rating,
            time: win.estimated_impact?.time || '1-2 days',
          },
          difficulty: win.difficulty || 'easy',
          category: win.category || 'general',
          actionSteps: win.action_steps || [],
        })
      );
    }

    // Parse comparative insights
    if (parsedInsights.comparative_insights) {
      const comp = parsedInsights.comparative_insights;
      insights.comparative = {
        peerRanking: {
          overall: comp.peer_ranking?.overall || 50,
          trips: comp.peer_ranking?.trips || 50,
          earnings: comp.peer_ranking?.earnings || 50,
          ratings: comp.peer_ranking?.ratings || 50,
          efficiency: comp.peer_ranking?.efficiency || 50,
        },
        topPerformerGap: {
          trips: comp.top_performer_gap?.trips || 0,
          earnings: comp.top_performer_gap?.earnings || 0,
          ratings: comp.top_performer_gap?.ratings || 0,
        },
        strengthsVsPeer: comp.strengths_vs_peer || [],
        improvementOpportunities:
          comp.improvement_opportunities?.map((opp: any) => ({
            metric: opp.metric || '',
            currentValue: opp.current_value || 0,
            peerAverage: opp.peer_average || 0,
            topPerformerValue: opp.top_performer_value || 0,
            potential: opp.potential || '',
          })) || [],
      };
    }

    // Parse opportunities
    if (
      parsedInsights.opportunities &&
      Array.isArray(parsedInsights.opportunities)
    ) {
      insights.opportunities = parsedInsights.opportunities.map(
        (opp: any, idx: number) => ({
          id: `opp-${idx}`,
          type: opp.type || 'performance',
          title: opp.title || 'Opportunity',
          description: opp.description || '',
          potentialImpact: {
            earnings: opp.potential_impact?.earnings,
            rating: opp.potential_impact?.rating,
            trips: opp.potential_impact?.trips,
          },
          feasibility: opp.feasibility || 'medium',
          timeframe: opp.timeframe || '1 month',
          requirements: opp.requirements || [],
        })
      );
    }

    // Parse financial health
    if (parsedInsights.financial_health) {
      const fh = parsedInsights.financial_health;
      insights.financialHealth = {
        score: fh.score || 50,
        level: fh.level || 'fair',
        factors:
          fh.factors?.map((factor: any) => ({
            name: factor.name || '',
            value: factor.value || '',
            status: factor.status || 'neutral',
            impact: factor.impact || '',
          })) || [],
        recommendations: fh.recommendations || [],
      };
    }

    // Add risk detection from metrics (complement AI-generated risks)
    const detectedRisks = detectRisks(metrics);
    if (detectedRisks.length > 0) {
      // Merge with AI-generated risks, prioritizing detected risks
      insights.riskAlerts = [...detectedRisks, ...(insights.riskAlerts || [])];
    }

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
      "category": "optional category",
      "predicted_impact": {
        "earnings": number (potential earnings increase in IDR, optional),
        "rating": number (potential rating increase 0-5, optional),
        "timeframe": "string (e.g., '1-2 weeks', '1 month')",
        "confidence": "high" | "medium" | "low"
      }
    }
  ],
  "risk_alerts": [
    {
      "type": "safety" | "financial" | "operational" | "quality" | "compliance",
      "severity": "critical" | "high" | "medium" | "low",
      "title": "risk alert title",
      "description": "detailed description of the risk",
      "metric": "metric name that triggered the alert",
      "current_value": "current metric value",
      "threshold": "acceptable threshold value",
      "recommended_action": "action to address the risk",
      "impact": "potential impact if not addressed"
    }
  ],
  "quick_wins": [
    {
      "title": "quick win title",
      "description": "description of the quick win",
      "estimated_impact": {
        "earnings": number (potential earnings increase in IDR, optional),
        "rating": number (potential rating increase 0-5, optional),
        "time": "time to implement (e.g., '1 day', '2 days')"
      },
      "difficulty": "easy" | "medium" | "hard",
      "category": "category name",
      "action_steps": ["step 1", "step 2", "step 3"]
    }
  ],
  "comparative_insights": {
    "peer_ranking": {
      "overall": number (percentile 0-100),
      "trips": number (percentile 0-100),
      "earnings": number (percentile 0-100),
      "ratings": number (percentile 0-100),
      "efficiency": number (percentile 0-100)
    },
    "top_performer_gap": {
      "trips": number (percentage gap),
      "earnings": number (percentage gap),
      "ratings": number (percentage gap)
    },
    "strengths_vs_peer": ["strength 1", "strength 2"],
    "improvement_opportunities": [
      {
        "metric": "metric name",
        "current_value": number,
        "peer_average": number,
        "top_performer_value": number,
        "potential": "description of potential improvement"
      }
    ]
  },
  "opportunities": [
    {
      "type": "earnings" | "performance" | "efficiency" | "growth",
      "title": "opportunity title",
      "description": "detailed description",
      "potential_impact": {
        "earnings": number (potential earnings increase in IDR, optional),
        "rating": number (potential rating increase 0-5, optional),
        "trips": number (potential trips increase, optional)
      },
      "feasibility": "high" | "medium" | "low",
      "timeframe": "estimated time to achieve (e.g., '1 month', '3 months')",
      "requirements": ["requirement 1", "requirement 2"]
    }
  ],
  "financial_health": {
    "score": number (0-100),
    "level": "excellent" | "good" | "fair" | "poor",
    "factors": [
      {
        "name": "factor name",
        "value": "factor value",
        "status": "positive" | "neutral" | "negative",
        "impact": "description of impact"
      }
    ],
    "recommendations": ["recommendation 1", "recommendation 2"]
  },
  "summary": "brief summary of overall performance and key insights"
}

IMPORTANT INSTRUCTIONS:
1. Risk Alerts: Analyze metrics to detect risks. Set severity based on:
   - Critical: Safety incidents, severe financial issues
   - High: Significant operational problems, quality issues
   - Medium: Moderate concerns that need attention
   - Low: Minor issues to monitor

2. Quick Wins: Focus on actions that can be done in 1-2 days with high impact. Prioritize by impact vs effort.

3. Comparative Insights: Use comparative metrics to show where guide stands vs peers and top performers.

4. Opportunities: Identify actionable opportunities with clear potential impact and feasibility.

5. Financial Health: Calculate score based on savings rate, withdrawal frequency, penalty impact, and earnings stability.

6. Recommendations: Include predicted impact for each recommendation showing potential earnings/rating increase.

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
 * Detect risks from metrics
 * This function analyzes metrics to identify potential risks that need attention
 */
function detectRisks(metrics: UnifiedMetrics): UnifiedAIInsights['riskAlerts'] {
  const risks: UnifiedAIInsights['riskAlerts'] = [];

  // Safety risks
  if (metrics.safety) {
    if (metrics.safety.incidentFrequency > 5) {
      risks.push({
        id: 'risk-safety-incident',
        type: 'safety',
        severity: metrics.safety.incidentFrequency > 10 ? 'critical' : 'high',
        title: 'Tingkat Insiden Tinggi',
        description: `Frekuensi insiden ${metrics.safety.incidentFrequency.toFixed(1)} per 100 trip melebihi batas aman.`,
        metric: 'Incident Frequency',
        currentValue: `${metrics.safety.incidentFrequency.toFixed(1)} per 100 trips`,
        threshold: '5 per 100 trips',
        recommendedAction:
          'Lakukan review menyeluruh terhadap prosedur keselamatan dan pastikan semua risk assessment dilakukan sebelum trip.',
        impact:
          'Dapat menyebabkan penurunan rating, kehilangan kepercayaan customer, dan potensi masalah hukum.',
      });
    }

    if (
      metrics.safety.safetyComplianceScore !== null &&
      metrics.safety.safetyComplianceScore < 70
    ) {
      risks.push({
        id: 'risk-safety-compliance',
        type: 'safety',
        severity:
          metrics.safety.safetyComplianceScore < 50 ? 'critical' : 'high',
        title: 'Safety Compliance Rendah',
        description: `Safety compliance score ${metrics.safety.safetyComplianceScore}/100 berada di bawah standar.`,
        metric: 'Safety Compliance Score',
        currentValue: `${metrics.safety.safetyComplianceScore}/100`,
        threshold: '70/100',
        recommendedAction:
          'Tingkatkan compliance dengan menyelesaikan semua safety checklist dan risk assessment sebelum trip.',
        impact: 'Dapat menyebabkan insiden keselamatan dan penurunan rating.',
      });
    }
  }

  // Financial risks
  if (metrics.financial) {
    if (metrics.financial.penaltyImpact > 10) {
      risks.push({
        id: 'risk-financial-penalty',
        type: 'financial',
        severity: metrics.financial.penaltyImpact > 20 ? 'critical' : 'high',
        title: 'Dampak Penalty Tinggi',
        description: `Penalty impact ${metrics.financial.penaltyImpact.toFixed(1)}% mengurangi earnings secara signifikan.`,
        metric: 'Penalty Impact',
        currentValue: `${metrics.financial.penaltyImpact.toFixed(1)}%`,
        threshold: '10%',
        recommendedAction:
          'Fokus pada on-time completion dan compliance untuk mengurangi penalty.',
        impact:
          'Dapat mengurangi earnings hingga 20% atau lebih jika tidak ditangani.',
      });
    }

    if (
      metrics.financial.savingsRate !== null &&
      metrics.financial.savingsRate < 10
    ) {
      risks.push({
        id: 'risk-financial-savings',
        type: 'financial',
        severity: 'medium',
        title: 'Savings Rate Rendah',
        description: `Savings rate ${metrics.financial.savingsRate.toFixed(0)}% di bawah rekomendasi minimum.`,
        metric: 'Savings Rate',
        currentValue: `${metrics.financial.savingsRate.toFixed(0)}%`,
        threshold: '10%',
        recommendedAction:
          'Buat rencana penghematan dan kurangi withdrawal frequency untuk meningkatkan savings rate.',
        impact:
          'Dapat menyebabkan kesulitan finansial di masa depan jika tidak ada tabungan.',
      });
    }
  }

  // Operational risks
  if (metrics.operations) {
    if (
      metrics.operations.equipmentChecklistRate !== null &&
      metrics.operations.equipmentChecklistRate < 80
    ) {
      risks.push({
        id: 'risk-operational-equipment',
        type: 'operational',
        severity:
          metrics.operations.equipmentChecklistRate < 60 ? 'high' : 'medium',
        title: 'Equipment Checklist Tidak Lengkap',
        description: `Equipment checklist rate ${metrics.operations.equipmentChecklistRate.toFixed(0)}% di bawah standar.`,
        metric: 'Equipment Checklist Rate',
        currentValue: `${metrics.operations.equipmentChecklistRate.toFixed(0)}%`,
        threshold: '80%',
        recommendedAction:
          'Pastikan semua equipment checklist diselesaikan sebelum setiap trip.',
        impact:
          'Dapat menyebabkan masalah operasional dan penurunan kualitas service.',
      });
    }

    if (
      metrics.operations.riskAssessmentRate !== null &&
      metrics.operations.riskAssessmentRate < 90
    ) {
      risks.push({
        id: 'risk-operational-risk-assessment',
        type: 'compliance',
        severity:
          metrics.operations.riskAssessmentRate < 70 ? 'high' : 'medium',
        title: 'Risk Assessment Tidak Lengkap',
        description: `Risk assessment rate ${metrics.operations.riskAssessmentRate.toFixed(0)}% perlu ditingkatkan.`,
        metric: 'Risk Assessment Rate',
        currentValue: `${metrics.operations.riskAssessmentRate.toFixed(0)}%`,
        threshold: '90%',
        recommendedAction:
          'Lakukan risk assessment untuk setiap trip sebelum departure.',
        impact: 'Dapat meningkatkan risiko keselamatan dan masalah compliance.',
      });
    }
  }

  // Quality risks
  if (metrics.quality) {
    if (metrics.quality.noShowRate !== null && metrics.quality.noShowRate > 5) {
      risks.push({
        id: 'risk-quality-no-show',
        type: 'quality',
        severity: metrics.quality.noShowRate > 10 ? 'high' : 'medium',
        title: 'No-Show Rate Tinggi',
        description: `No-show rate ${metrics.quality.noShowRate.toFixed(0)}% melebihi batas normal.`,
        metric: 'No-Show Rate',
        currentValue: `${metrics.quality.noShowRate.toFixed(0)}%`,
        threshold: '5%',
        recommendedAction:
          'Tingkatkan komunikasi dengan customer sebelum trip dan pastikan konfirmasi ulang.',
        impact:
          'Dapat mengurangi earnings dan rating karena trip cancellation.',
      });
    }

    if (
      metrics.quality.lateCheckInRate !== null &&
      metrics.quality.lateCheckInRate > 10
    ) {
      risks.push({
        id: 'risk-quality-late-checkin',
        type: 'quality',
        severity: 'medium',
        title: 'Late Check-in Rate Tinggi',
        description: `Late check-in rate ${metrics.quality.lateCheckInRate.toFixed(0)}% perlu diperbaiki.`,
        metric: 'Late Check-in Rate',
        currentValue: `${metrics.quality.lateCheckInRate.toFixed(0)}%`,
        threshold: '10%',
        recommendedAction:
          'Tingkatkan time management dan pastikan tiba di lokasi lebih awal.',
        impact: 'Dapat menyebabkan penurunan customer satisfaction dan rating.',
      });
    }
  }

  return risks;
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
