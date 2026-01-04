/**
 * AI Sales Insights Engine
 * BRD 10 - AI Sales Insights
 * Analyzes sales data and generates actionable insights
 */

import { chat } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type SalesData = {
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalRevenue: number;
    totalCommission: number;
    totalBookings: number;
    averageCommission: number;
    repeatRate: number;
    totalCustomers: number;
    repeatCustomers: number;
  };
  trends: {
    revenue: Array<{
      date: string;
      revenue: number;
      commission: number;
      bookings: number;
    }>;
  };
  topPackages: {
    byBookings: Array<{
      packageName: string;
      bookingCount: number;
      revenue: number;
      commission: number;
    }>;
    byRevenue: Array<{
      packageName: string;
      bookingCount: number;
      revenue: number;
      commission: number;
    }>;
  };
  customerInsights: {
    repeatRate: number;
    totalCustomers: number;
    repeatCustomers: number;
  };
};

export type SalesInsight = {
  type: 'trend' | 'opportunity' | 'warning' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  actionItems?: string[];
  metrics?: {
    current: number;
    target?: number;
    change?: number;
  };
};

export type SalesInsights = {
  insights: SalesInsight[];
  predictions: {
    nextMonthRevenue: number;
    nextMonthBookings: number;
    bestSellingPackages: Array<{
      packageName: string;
      predictedBookings: number;
      confidence: 'high' | 'medium' | 'low';
    }>;
  };
  recommendations: Array<{
    category: 'pricing' | 'promotion' | 'packages' | 'customers';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
};

const SYSTEM_PROMPT = `You are an AI Sales Insights Analyst for Aero Travel Partner Portal.
Your job is to analyze sales data and generate actionable insights.

You receive:
- Sales summary (revenue, bookings, commissions)
- Trends data (daily/weekly revenue trends)
- Top packages (by bookings and revenue)
- Customer insights (repeat rate, customer count)

Your task:
1. Identify trends and patterns
2. Highlight opportunities
3. Warn about potential issues
4. Provide actionable recommendations
5. Predict future performance

Guidelines:
- Be specific and data-driven
- Focus on actionable insights
- Prioritize high-impact recommendations
- Explain "why" for each insight
- Use Indonesian (Bahasa Indonesia)

Output format (JSON):
{
  "insights": [
    {
      "type": "trend|opportunity|warning|recommendation",
      "title": "Insight title",
      "description": "Detailed explanation",
      "impact": "high|medium|low",
      "actionable": true,
      "actionItems": ["Action 1", "Action 2"],
      "metrics": { "current": 100, "target": 150, "change": 50 }
    }
  ],
  "predictions": {
    "nextMonthRevenue": 50000000,
    "nextMonthBookings": 20,
    "bestSellingPackages": [...]
  },
  "recommendations": [...]
}

Be concise but informative.`;

/**
 * Generate sales insights dari sales data
 */
export async function generateSalesInsights(
  salesData: SalesData,
  partnerId: string
): Promise<SalesInsights> {
  try {
    // Build context string dari sales data
    const context = buildSalesContext(salesData);

    // Build prompt
    const prompt = `${context}

Please analyze this sales data and provide:
1. Key insights (trends, opportunities, warnings)
2. Predictions for next month
3. Actionable recommendations

Focus on high-impact insights that can help improve sales.`;

    // Call Gemini AI
    const response = await chat(
      [{ role: 'user', content: prompt }],
      SYSTEM_PROMPT,
      'gemini-1.5-flash'
    );

    // Try to parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and format insights
        const insights: SalesInsight[] = (parsed.insights || []).map((insight: unknown) => {
          const i = insight as {
            type?: string;
            title?: string;
            description?: string;
            impact?: string;
            actionable?: boolean;
            actionItems?: string[];
            metrics?: unknown;
          };
          return {
            type: (i.type || 'recommendation') as SalesInsight['type'],
            title: i.title || 'Insight',
            description: i.description || '',
            impact: (i.impact || 'medium') as SalesInsight['impact'],
            actionable: i.actionable ?? true,
            actionItems: i.actionItems || [],
            metrics: i.metrics as SalesInsight['metrics'],
          };
        });

        const predictions = parsed.predictions || {
          nextMonthRevenue: 0,
          nextMonthBookings: 0,
          bestSellingPackages: [],
        };

        const recommendations = (parsed.recommendations || []).map((rec: unknown) => {
          const r = rec as {
            category?: string;
            title?: string;
            description?: string;
            priority?: string;
          };
          return {
            category: (r.category || 'packages') as SalesInsights['recommendations'][0]['category'],
            title: r.title || 'Recommendation',
            description: r.description || '',
            priority: (r.priority || 'medium') as SalesInsights['recommendations'][0]['priority'],
          };
        });

        logger.info('Sales insights generated', {
          partnerId,
          insightsCount: insights.length,
          recommendationsCount: recommendations.length,
        });

        return {
          insights,
          predictions,
          recommendations,
        };
      } catch (parseError) {
        logger.warn('Failed to parse insights response as JSON', {
          error: parseError,
          response,
        });
      }
    }

    // Fallback: Generate basic insights dari data
    return generateBasicInsights(salesData);
  } catch (error) {
    logger.error('Failed to generate sales insights', error, { partnerId });
    return generateBasicInsights(salesData);
  }
}

/**
 * Build context string dari sales data
 */
function buildSalesContext(data: SalesData): string {
  let context = 'SALES DATA ANALYSIS:\n\n';

  // Summary
  context += `SUMMARY (${data.period.from} to ${data.period.to}):\n`;
  context += `  Total Revenue: Rp ${data.summary.totalRevenue.toLocaleString('id-ID')}\n`;
  context += `  Total Commission: Rp ${data.summary.totalCommission.toLocaleString('id-ID')}\n`;
  context += `  Total Bookings: ${data.summary.totalBookings}\n`;
  context += `  Average Commission: Rp ${data.summary.averageCommission.toLocaleString('id-ID')}\n`;
  context += `  Repeat Rate: ${(data.summary.repeatRate * 100).toFixed(1)}%\n`;
  context += `  Total Customers: ${data.summary.totalCustomers}\n`;
  context += `  Repeat Customers: ${data.summary.repeatCustomers}\n\n`;

  // Trends
  if (data.trends.revenue.length > 0) {
    context += `REVENUE TRENDS (Last ${data.trends.revenue.length} days):\n`;
    data.trends.revenue.slice(-7).forEach((trend) => {
      context += `  ${trend.date}: Rp ${trend.revenue.toLocaleString('id-ID')} (${trend.bookings} bookings)\n`;
    });
    context += '\n';
  }

  // Top Packages
  if (data.topPackages.byBookings.length > 0) {
    context += `TOP PACKAGES (By Bookings):\n`;
    data.topPackages.byBookings.slice(0, 5).forEach((pkg, idx) => {
      context += `  ${idx + 1}. ${pkg.packageName}: ${pkg.bookingCount} bookings, Rp ${pkg.revenue.toLocaleString('id-ID')} revenue\n`;
    });
    context += '\n';
  }

  if (data.topPackages.byRevenue.length > 0) {
    context += `TOP PACKAGES (By Revenue):\n`;
    data.topPackages.byRevenue.slice(0, 5).forEach((pkg, idx) => {
      context += `  ${idx + 1}. ${pkg.packageName}: Rp ${pkg.revenue.toLocaleString('id-ID')} revenue, ${pkg.bookingCount} bookings\n`;
    });
    context += '\n';
  }

  return context;
}

/**
 * Generate basic insights jika AI parsing fails
 */
function generateBasicInsights(data: SalesData): SalesInsights {
  const insights: SalesInsight[] = [];
  const recommendations: SalesInsights['recommendations'] = [];

  // Analyze trends
  if (data.trends.revenue.length >= 7) {
    const recentRevenue = data.trends.revenue.slice(-7);
    const avgRecent = recentRevenue.reduce((sum, t) => sum + t.revenue, 0) / recentRevenue.length;
    const avgEarlier = data.trends.revenue.slice(0, -7).reduce((sum, t) => sum + t.revenue, 0) / Math.max(1, data.trends.revenue.length - 7);
    
    if (avgRecent > avgEarlier * 1.1) {
      insights.push({
        type: 'trend',
        title: 'Revenue Meningkat',
        description: `Revenue 7 hari terakhir ${((avgRecent / avgEarlier - 1) * 100).toFixed(1)}% lebih tinggi dari sebelumnya.`,
        impact: 'high',
        actionable: true,
        metrics: {
          current: avgRecent,
          change: avgRecent - avgEarlier,
        },
      });
    } else if (avgRecent < avgEarlier * 0.9) {
      insights.push({
        type: 'warning',
        title: 'Revenue Menurun',
        description: `Revenue 7 hari terakhir ${((1 - avgRecent / avgEarlier) * 100).toFixed(1)}% lebih rendah. Perlu perhatian.`,
        impact: 'high',
        actionable: true,
        actionItems: ['Review pricing strategy', 'Increase marketing efforts'],
      });
    }
  }

  // Top package insights
  if (data.topPackages.byBookings.length > 0) {
    const topPackage = data.topPackages.byBookings[0];
    insights.push({
      type: 'opportunity',
      title: `Fokus pada ${topPackage.packageName}`,
      description: `Package ini adalah best seller dengan ${topPackage.bookingCount} bookings. Pertimbangkan untuk promosi lebih agresif.`,
      impact: 'high',
      actionable: true,
      actionItems: [
        `Promote ${topPackage.packageName} lebih aktif`,
        'Buat special offer untuk package ini',
      ],
    });
  }

  // Repeat rate insights
  if (data.summary.repeatRate < 0.2) {
    insights.push({
      type: 'warning',
      title: 'Repeat Rate Rendah',
      description: `Repeat rate hanya ${(data.summary.repeatRate * 100).toFixed(1)}%. Fokus pada customer retention.`,
      impact: 'medium',
      actionable: true,
      actionItems: [
        'Implement loyalty program',
        'Follow up dengan existing customers',
        'Offer special deals untuk repeat customers',
      ],
    });
  }

  // Predictions (simple linear projection)
  const avgDailyRevenue = data.trends.revenue.length > 0
    ? data.trends.revenue.reduce((sum, t) => sum + t.revenue, 0) / data.trends.revenue.length
    : 0;
  const avgDailyBookings = data.trends.revenue.length > 0
    ? data.trends.revenue.reduce((sum, t) => sum + t.bookings, 0) / data.trends.revenue.length
    : 0;

  return {
    insights,
    predictions: {
      nextMonthRevenue: avgDailyRevenue * 30,
      nextMonthBookings: Math.round(avgDailyBookings * 30),
      bestSellingPackages: data.topPackages.byBookings.slice(0, 3).map((pkg) => ({
        packageName: pkg.packageName,
        predictedBookings: Math.round(pkg.bookingCount * 1.1), // 10% growth assumption
        confidence: 'medium' as const,
      })),
    },
    recommendations,
  };
}

