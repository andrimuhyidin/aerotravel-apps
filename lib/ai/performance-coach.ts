/**
 * AI Performance Coach
 * Personalized coaching, skill gap analysis, learning path
 */

import { generateContentWithFallback } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type PerformanceData = {
  guideId: string;
  completedTrips: number;
  averageRating: number;
  totalRatings: number;
  totalEarnings: number;
  skills: Array<{
    name: string;
    level: number; // 1-5
    certified: boolean;
  }>;
  recentFeedback: Array<{
    rating: number;
    comment: string;
    category: string;
  }>;
  attendance: {
    onTime: number;
    late: number;
    total: number;
  };
  trends: {
    ratingTrend: 'improving' | 'stable' | 'declining';
    earningsTrend: 'increasing' | 'stable' | 'decreasing';
  };
};

export type CoachingPlan = {
  strengths: string[];
  weaknesses: string[];
  skillGaps: Array<{
    skill: string;
    currentLevel: number;
    targetLevel: number;
    priority: 'high' | 'medium' | 'low';
    learningPath: string[];
  }>;
  recommendations: Array<{
    type: 'training' | 'practice' | 'feedback' | 'certification';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: string;
  }>;
  actionPlan: Array<{
    week: number;
    goals: string[];
    focus: string;
  }>;
};

/**
 * Generate personalized coaching plan
 */
export async function generateCoachingPlan(
  performance: PerformanceData
): Promise<CoachingPlan> {
  try {
    const contextString = buildPerformanceContext(performance);

    const prompt = `${contextString}

Based on this performance data, create a personalized coaching plan for the guide.

Provide:
1. Strengths (what they're good at)
2. Weaknesses (areas for improvement)
3. Skill gaps (specific skills that need development)
4. Recommendations (training, practice, feedback, certification)
5. Action plan (4-week plan with weekly goals)

Return JSON:
{
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "skillGaps": [
    {
      "skill": "skill name",
      "currentLevel": 1-5,
      "targetLevel": 1-5,
      "priority": "high" | "medium" | "low",
      "learningPath": ["step 1", "step 2"]
    }
  ],
  "recommendations": [
    {
      "type": "training" | "practice" | "feedback" | "certification",
      "title": "recommendation title",
      "description": "detailed description",
      "priority": "high" | "medium" | "low",
      "estimatedImpact": "expected impact"
    }
  ],
  "actionPlan": [
    {
      "week": 1,
      "goals": ["goal 1", "goal 2"],
      "focus": "main focus area"
    }
  ]
}

Return ONLY the JSON object, no additional text.`;

    const response = await generateContentWithFallback(
      prompt,
      undefined,
      'gemini-1.5-flash'
    );

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const plan = JSON.parse(cleaned) as CoachingPlan;

      // Validate and enhance plan
      return enhanceCoachingPlan(plan, performance);
    } catch (parseError) {
      logger.warn('Failed to parse AI coaching plan response, using fallback', {
        error:
          parseError instanceof Error ? parseError.message : String(parseError),
      });
      return getFallbackCoachingPlan(performance);
    }
  } catch (error) {
    // AI generation failed, use fallback - this is expected behavior
    logger.warn('AI coaching plan generation failed, using fallback', {
      error: error instanceof Error ? error.message : String(error),
    });
    return getFallbackCoachingPlan(performance);
  }
}

function buildPerformanceContext(performance: PerformanceData): string {
  let str = `PERFORMANCE DATA:
- Completed Trips: ${performance.completedTrips}
- Average Rating: ${performance.averageRating}/5.0 (${performance.totalRatings} ratings)
- Total Earnings: Rp ${performance.totalEarnings.toLocaleString('id-ID')}
- Rating Trend: ${performance.trends.ratingTrend}
- Earnings Trend: ${performance.trends.earningsTrend}

ATTENDANCE:
- On Time: ${performance.attendance.onTime}/${performance.attendance.total}
- Late: ${performance.attendance.late}/${performance.attendance.total}
`;

  if (performance.skills.length > 0) {
    str += `\nSKILLS:\n`;
    performance.skills.forEach((skill) => {
      str += `- ${skill.name}: Level ${skill.level}/5${skill.certified ? ' (Certified)' : ''}\n`;
    });
  }

  if (performance.recentFeedback.length > 0) {
    str += `\nRECENT FEEDBACK:\n`;
    performance.recentFeedback.slice(0, 5).forEach((fb) => {
      str += `- ${fb.rating}/5 - ${fb.category}: "${fb.comment.substring(0, 100)}"\n`;
    });
  }

  return str;
}

function enhanceCoachingPlan(
  plan: CoachingPlan,
  _performance: PerformanceData
): CoachingPlan {
  // Ensure action plan has 4 weeks
  if (plan.actionPlan.length < 4) {
    const weeks = plan.actionPlan.length;
    for (let i = weeks; i < 4; i++) {
      plan.actionPlan.push({
        week: i + 1,
        goals: [
          `Continue working on ${plan.weaknesses[0] || 'performance improvement'}`,
        ],
        focus: plan.weaknesses[0] || 'General improvement',
      });
    }
  }

  // Prioritize skill gaps based on performance
  plan.skillGaps = plan.skillGaps
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 5); // Top 5 skill gaps

  return plan;
}

function getFallbackCoachingPlan(performance: PerformanceData): CoachingPlan {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (performance.averageRating >= 4.5) {
    strengths.push('Excellent customer satisfaction');
  } else if (performance.averageRating < 3.5) {
    weaknesses.push('Customer satisfaction needs improvement');
  }

  if (performance.attendance.onTime / performance.attendance.total >= 0.9) {
    strengths.push('Reliable attendance');
  } else {
    weaknesses.push('Attendance punctuality needs improvement');
  }

  return {
    strengths: strengths.length > 0 ? strengths : ['Consistent performance'],
    weaknesses:
      weaknesses.length > 0 ? weaknesses : ['Continue skill development'],
    skillGaps: [],
    recommendations: [
      {
        type: 'training',
        title: 'Continue Professional Development',
        description: 'Participate in available training modules',
        priority: 'medium',
        estimatedImpact: 'Improved skills and performance',
      },
    ],
    actionPlan: [
      {
        week: 1,
        goals: ['Focus on customer service'],
        focus: 'Service quality',
      },
      {
        week: 2,
        goals: ['Improve communication'],
        focus: 'Communication',
      },
      {
        week: 3,
        goals: ['Enhance safety awareness'],
        focus: 'Safety',
      },
      {
        week: 4,
        goals: ['Review and reflect'],
        focus: 'Continuous improvement',
      },
    ],
  };
}
