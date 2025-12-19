'use client';

/**
 * AI Performance Coach Widget
 * Personalized coaching, skill gap analysis, learning path
 */

import { useQuery } from '@tanstack/react-query';
import { Award, BookOpen, Target, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';

type PerformanceAiCoachProps = {
  locale: string;
};

export function PerformanceAiCoach({ locale: _locale }: PerformanceAiCoachProps) {
  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.guide.performance.all(), 'coach'],
    queryFn: async () => {
      const res = await fetch('/api/guide/performance/coach');
      if (!res.ok) throw new Error('Failed to load coaching plan');
      return (await res.json()) as {
        performance: unknown;
        coachingPlan: {
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
            type: string;
            title: string;
            description: string;
            priority: 'high' | 'medium' | 'low';
          }>;
          actionPlan: Array<{
            week: number;
            goals: string[];
            focus: string;
          }>;
        };
      };
    },
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent>
          <LoadingState variant="spinner" message="Memuat coaching plan..." />
        </CardContent>
      </Card>
    );
  }

  if (!data?.coachingPlan) {
    return null;
  }

  const { coachingPlan } = data;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Award className="h-5 w-5 text-emerald-600" />
          AI Performance Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-2 gap-3">
          {coachingPlan.strengths.length > 0 && (
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-900">Kekuatan</p>
              <ul className="mt-2 space-y-1">
                {coachingPlan.strengths.slice(0, 3).map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-xs text-emerald-800">
                    <span className="mt-0.5">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {coachingPlan.weaknesses.length > 0 && (
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-900">Perlu Dijaga</p>
              <ul className="mt-2 space-y-1">
                {coachingPlan.weaknesses.slice(0, 3).map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-xs text-amber-800">
                    <span className="mt-0.5">⚠</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Top Recommendations */}
        {coachingPlan.recommendations.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700">Rekomendasi</p>
            <div className="space-y-2">
              {coachingPlan.recommendations.slice(0, 3).map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2.5"
                >
                  {rec.type === 'training' && <BookOpen className="h-4 w-4 text-blue-600 mt-0.5" />}
                  {rec.type === 'practice' && <Target className="h-4 w-4 text-emerald-600 mt-0.5" />}
                  {rec.type === 'feedback' && <TrendingUp className="h-4 w-4 text-purple-600 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-900">{rec.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-600">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Plan Preview */}
        {coachingPlan.actionPlan.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700">Action Plan (4 Minggu)</p>
            <div className="space-y-1.5">
              {coachingPlan.actionPlan.slice(0, 2).map((week) => (
                <div
                  key={week.week}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"
                >
                  <p className="text-xs font-semibold text-slate-900">
                    Minggu {week.week}: {week.focus}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {week.goals.slice(0, 2).map((goal, idx) => (
                      <li key={idx} className="text-[11px] text-slate-600">
                        • {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
