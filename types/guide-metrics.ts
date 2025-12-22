/**
 * Unified Metrics Type Definitions
 * Single source of truth for all guide performance metrics
 */

export type UnifiedMetrics = {
  period: {
    start: string;
    end: string;
    type: 'monthly' | 'weekly' | 'custom';
  };
  trips: {
    total: number;
    completed: number;
    cancelled: number;
    trend?: {
      value: number;
      direction: 'up' | 'down' | 'stable';
    };
  };
  earnings: {
    total: number;
    average: number;
    byTrip: number;
    trend?: {
      value: number;
      direction: 'up' | 'down' | 'stable';
    };
  };
  ratings: {
    average: number | null;
    total: number;
    trend: number[];
    distribution?: {
      '1': number;
      '2': number;
      '3': number;
      '4': number;
      '5': number;
    };
  };
  performance: {
    score: number | null;
    tier: string | null;
    onTimeRate: number | null;
    percentile: number;
  };
  development: {
    skillsImproved: number;
    assessmentsCompleted: number;
  };
  customerSatisfaction?: {
    responseRate: number | null; // Percentage of reviews responded to
    repeatCustomerRate: number | null; // Percentage of repeat customers
    complaintResolutionRate: number | null; // Percentage of complaints resolved
    satisfactionScore: number | null; // Customer satisfaction score
  };
  efficiency?: {
    avgTripDuration: number | null; // Average trip duration in hours
    guestToTripRatio: number | null; // Average guests per trip
    revenuePerGuest: number | null; // Revenue per guest
    utilizationRate: number | null; // Percentage of active days vs available days
    avgResponseTime: number | null; // Average response time to trip assignments in hours
  };
  financial?: {
    netEarnings: number; // Total earnings minus penalties
    penaltyImpact: number; // Percentage of penalties vs total earnings
    savingsRate: number | null; // Percentage of earnings saved
    withdrawalFrequency: number; // Number of withdrawals per month
    earningsTrend: number[]; // Earnings trend for last 3-6 months
  };
  quality?: {
    onTimeCompletionRate: number | null; // Percentage of trips completed on time
    noShowRate: number | null; // Percentage of trips cancelled by guide
    documentationCompletionRate: number | null; // Percentage of trips with complete documentation
    issueResolutionRate: number | null; // Percentage of issues resolved
    lateCheckInRate: number | null; // Percentage of late check-ins
  };
  growth?: {
    momGrowth: {
      trips: number | null; // Month-over-month growth for trips
      earnings: number | null; // Month-over-month growth for earnings
      ratings: number | null; // Month-over-month growth for ratings
    };
    skillProgressionRate: number | null; // Average skill level improvement
    certificationCompletionRate: number | null; // Percentage of certifications completed
    assessmentImprovement: number | null; // Trend of assessment score improvement
  };
  comparative?: {
    peerRanking: number | null; // Ranking among peers in same branch
    percentileImprovement: number | null; // Change in percentile from previous period
    topPerformerGap: {
      trips: number | null; // Gap with top performer in trips
      earnings: number | null; // Gap with top performer in earnings
      ratings: number | null; // Gap with top performer in ratings
    };
    marketShare: number | null; // Percentage of trips taken vs total available
  };
};

export type MetricsCalculationOptions = {
  include?: (
    | 'trips'
    | 'earnings'
    | 'ratings'
    | 'performance'
    | 'development'
    | 'trends'
    | 'customerSatisfaction'
    | 'efficiency'
    | 'financial'
    | 'quality'
    | 'growth'
    | 'comparative'
  )[];
  calculateTrends?: boolean;
  compareWithPrevious?: boolean;
};
