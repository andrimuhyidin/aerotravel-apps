/**
 * Challenges Client Component
 * Display guide challenges and progress with AI insights
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Award,
  CheckCircle2,
  Clock,
  Lightbulb,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';

type Challenge = {
  id: string;
  challenge_type: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed' | 'failed';
  reward_amount: number | null;
  reward_description?: string | null;
  title?: string;
  description?: string | null;
};

type ChallengesResponse = {
  challenges: Challenge[];
};

type ChallengesClientProps = {
  locale: string;
};

const challengeTypeLabels: Record<string, string> = {
  total_trips: 'Total Trip',
  average_rating: 'Rating Rata-rata',
  no_penalties: 'Tanpa Penalty',
  new_destination: 'Destinasi Baru',
  total_earnings: 'Total Pendapatan',
  social_posts: 'Posting Sosial',
};

export function ChallengesClient({ locale: _locale }: ChallengesClientProps) {
  const { data, isLoading } = useQuery<ChallengesResponse>({
    queryKey: queryKeys.guide.challenges(),
    queryFn: async () => {
      const res = await fetch('/api/guide/challenges');
      if (!res.ok) throw new Error('Failed to fetch challenges');
      const json = await res.json();
      // API returns { challenges: [...] } directly
      return json;
    },
    staleTime: 60000,
  });

  // Fetch AI insights
  const { data: aiInsights, isLoading: insightsLoading } = useQuery<{
    tips: string[];
    strategies: string[];
    progressAnalysis: string;
    estimatedCompletion: string | null;
    recommendations: string[];
  }>({
    queryKey: ['guide-challenges-insights'],
    queryFn: async () => {
      const res = await fetch('/api/guide/challenges/insights');
      if (!res.ok) throw new Error('Failed to fetch AI insights');
      return res.json();
    },
    staleTime: 300000, // 5 minutes
    enabled: !!data && (data?.challenges || []).length > 0,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Skeleton className="mb-3 h-6 w-32" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Skeleton className="mb-3 h-6 w-32" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const challenges = data?.challenges ?? [];
  const activeChallenges = challenges.filter((c) => c && c.status === 'active');
  const completedChallenges = challenges.filter(
    (c) => c && c.status === 'completed'
  );

  const getProgress = (challenge: Challenge) => {
    if (!challenge || !challenge.target_value || challenge.target_value === 0)
      return 0;
    return Math.min(
      ((challenge.current_value ?? 0) / challenge.target_value) * 100,
      100
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'failed':
        return <Clock className="h-5 w-5 text-red-500" />;
      default:
        return <Target className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      {aiInsights && !insightsLoading && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-blue-50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              AI Insights & Strategi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.progressAnalysis && (
              <div>
                <h4 className="mb-1.5 text-xs font-semibold text-slate-700">
                  Analisis Progress
                </h4>
                <p className="text-sm leading-relaxed text-slate-600">
                  {aiInsights.progressAnalysis}
                </p>
              </div>
            )}

            {aiInsights.tips &&
              Array.isArray(aiInsights.tips) &&
              aiInsights.tips.length > 0 && (
                <div>
                  <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    Tips Praktis
                  </h4>
                  <ul className="space-y-1.5">
                    {aiInsights.tips.map((tip, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <span className="mt-0.5 text-emerald-600">•</span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {aiInsights.strategies &&
              Array.isArray(aiInsights.strategies) &&
              aiInsights.strategies.length > 0 && (
                <div>
                  <h4 className="mb-1.5 text-xs font-semibold text-slate-700">
                    Strategi
                  </h4>
                  <ul className="space-y-1.5">
                    {aiInsights.strategies.map((strategy, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <span className="mt-0.5 text-blue-600">→</span>
                        <span className="leading-relaxed">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {aiInsights.estimatedCompletion && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="mb-1 text-xs font-semibold text-amber-900">
                  Estimasi Penyelesaian
                </p>
                <p className="text-sm text-amber-800">
                  {aiInsights.estimatedCompletion}
                </p>
              </div>
            )}

            {aiInsights.recommendations &&
              Array.isArray(aiInsights.recommendations) &&
              aiInsights.recommendations.length > 0 && (
                <div>
                  <h4 className="mb-1.5 text-xs font-semibold text-slate-700">
                    Rekomendasi
                  </h4>
                  <ul className="space-y-1.5">
                    {aiInsights.recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <span className="mt-0.5 text-purple-600">✓</span>
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Challenges Aktif
          </h2>
          <div className="space-y-3">
            {activeChallenges
              .filter((c) => c && c.id)
              .map((challenge) => {
                const progress = getProgress(challenge);
                const remaining =
                  (challenge.target_value ?? 0) -
                  (challenge.current_value ?? 0);
                return (
                  <Card
                    key={challenge.id}
                    className="border-blue-200 bg-blue-50/50 shadow-sm"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            {getStatusIcon(challenge.status)}
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900">
                                {challenge.title ||
                                  challengeTypeLabels[
                                    challenge.challenge_type
                                  ] ||
                                  challenge.challenge_type}
                              </h3>
                              {challenge.description && (
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {challenge.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">
                                Progress:{' '}
                                <span className="font-semibold text-slate-900">
                                  {challenge.current_value}
                                </span>{' '}
                                / {challenge.target_value}
                              </span>
                              <span className="text-xs font-medium text-blue-600">
                                {Math.round(progress)}%
                              </span>
                            </div>
                            <Progress value={progress} className="h-2.5" />
                            {remaining > 0 && (
                              <p className="text-xs text-slate-500">
                                Tersisa:{' '}
                                <span className="font-medium">{remaining}</span>{' '}
                                untuk mencapai target
                              </p>
                            )}
                          </div>
                          {challenge.end_date && (
                            <div className="mt-2 text-xs text-slate-500">
                              Deadline:{' '}
                              {new Date(challenge.end_date).toLocaleDateString(
                                'id-ID',
                                {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                }
                              )}
                            </div>
                          )}
                          {(challenge.reward_amount ||
                            challenge.reward_description) && (
                            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-2">
                              <Trophy className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                              <span className="text-sm font-semibold text-emerald-700">
                                {challenge.reward_amount
                                  ? `Reward: Rp ${challenge.reward_amount.toLocaleString('id-ID')}`
                                  : challenge.reward_description ||
                                    'Reward tersedia'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Challenges Selesai
          </h2>
          <div className="space-y-3">
            {completedChallenges
              .filter((c) => c && c.id)
              .map((challenge) => (
                <Card
                  key={challenge.id}
                  className="border-emerald-200 bg-emerald-50/50 shadow-sm"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          {getStatusIcon(challenge.status)}
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">
                              {challenge.title ||
                                challengeTypeLabels[challenge.challenge_type] ||
                                challenge.challenge_type}
                            </h3>
                            {challenge.description && (
                              <p className="mt-0.5 text-xs text-slate-500">
                                {challenge.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-slate-600">
                            Target:{' '}
                            <span className="font-semibold">
                              {challenge.target_value}
                            </span>{' '}
                            • Tercapai:{' '}
                            <span className="font-semibold text-emerald-600">
                              {challenge.current_value}
                            </span>
                          </p>
                          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-2">
                            <Award className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                            {challenge.reward_amount ? (
                              <span className="text-sm font-semibold text-emerald-700">
                                Reward: Rp{' '}
                                {challenge.reward_amount.toLocaleString(
                                  'id-ID'
                                )}
                              </span>
                            ) : challenge.reward_description ? (
                              <span className="text-sm font-semibold text-emerald-700">
                                {challenge.reward_description}
                              </span>
                            ) : (
                              <span className="text-sm font-semibold text-emerald-700">
                                Challenge Selesai! 🎉
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {challenges.length === 0 && !isLoading && (
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="py-8 text-center">
            <Target className="mx-auto mb-3 h-12 w-12 text-slate-400" />
            <p className="mb-1 text-sm font-medium text-slate-700">
              Belum ada challenges
            </p>
            <p className="text-xs text-slate-500">
              Challenges akan muncul secara otomatis berdasarkan aktivitas Anda.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
