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
    predictedImpact?: {
      earnings?: number; // potential earnings increase
      rating?: number; // potential rating increase
      timeframe: string; // time to see impact
      confidence: 'high' | 'medium' | 'low';
    };
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
  riskAlerts?: Array<{
    id: string;
    type: 'safety' | 'financial' | 'operational' | 'quality' | 'compliance';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    metric: string; // metric yang trigger alert
    currentValue: number | string;
    threshold: number | string;
    recommendedAction: string;
    impact: string; // potential impact jika tidak ditangani
  }>;
  quickWins?: Array<{
    id: string;
    title: string;
    description: string;
    estimatedImpact: {
      earnings?: number; // potential earnings increase
      rating?: number; // potential rating increase
      time?: string; // time to implement
    };
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    actionSteps: string[]; // step-by-step actions
  }>;
  comparative?: {
    peerRanking: {
      overall: number; // percentile
      trips: number;
      earnings: number;
      ratings: number;
      efficiency: number;
    };
    topPerformerGap: {
      trips: number; // percentage gap
      earnings: number;
      ratings: number;
    };
    strengthsVsPeer: string[]; // areas where guide outperforms
    improvementOpportunities: Array<{
      metric: string;
      currentValue: number;
      peerAverage: number;
      topPerformerValue: number;
      potential: string; // potential improvement if reach peer average
    }>;
  };
  opportunities?: Array<{
    id: string;
    type: 'earnings' | 'performance' | 'efficiency' | 'growth';
    title: string;
    description: string;
    potentialImpact: {
      earnings?: number; // potential earnings increase
      rating?: number; // potential rating increase
      trips?: number; // potential trips increase
    };
    feasibility: 'high' | 'medium' | 'low';
    timeframe: string; // estimated time to achieve
    requirements: string[]; // what's needed to achieve this
  }>;
  financialHealth?: {
    score: number; // 0-100
    level: 'excellent' | 'good' | 'fair' | 'poor';
    factors: Array<{
      name: string;
      value: number | string;
      status: 'positive' | 'neutral' | 'negative';
      impact: string;
    }>;
    recommendations: string[];
  };
};

export type AIInsightsGenerationOptions = {
  include?: ('performance' | 'recommendations' | 'predictions' | 'coaching')[];
  includeCoaching?: boolean;
};
