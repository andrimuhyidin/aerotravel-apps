/**
 * Unified AI Insights Type Definitions
 * Single source of truth for all AI-generated insights
 */

export type UnifiedAIInsights = {
  performance: {
    strengths: string[];
    weaknesses: string[];
    trend: 'improving' | 'stable' | 'declining';
    summary?: string;
  };
  recommendations: Array<{
    id: string;
    type:
      | 'performance'
      | 'earning'
      | 'safety'
      | 'customer_service'
      | 'training'
      | 'practice'
      | 'feedback'
      | 'certification';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    source: 'performance' | 'coach' | 'insights';
    category?: string;
  }>;
  predictions: {
    income: {
      nextMonth: number;
      next3Months: number;
      confidence: 'high' | 'medium' | 'low';
      reasoning: string;
    };
    performance: {
      trend: 'improving' | 'stable' | 'declining';
      expectedScore?: number;
    };
  };
  coaching?: {
    actionPlan: Array<{
      week: number;
      goals: string[];
      focus: string;
    }>;
    skillGaps: Array<{
      skill: string;
      currentLevel: number;
      targetLevel: number;
      priority: 'high' | 'medium' | 'low';
      learningPath: string[];
    }>;
  };
};

export type AIInsightsGenerationOptions = {
  include?: ('performance' | 'recommendations' | 'predictions' | 'coaching')[];
  includeCoaching?: boolean;
};
