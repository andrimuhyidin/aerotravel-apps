/**
 * Challenges Widget Component
 * Compact challenges display for dashboard
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Target, Trophy } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';

type Challenge = {
  id: string;
  type?: string;
  challenge_type?: string;
  target?: number;
  target_value?: number;
  current?: number;
  current_value?: number;
  title?: string;
  start_date?: string;
  end_date?: string | null;
  status: 'active' | 'completed' | 'failed';
  reward?: string;
  reward_amount?: number | null;
};

type ChallengesResponse = {
  challenges: Challenge[];
};

type ChallengesWidgetProps = {
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

export function ChallengesWidget({ locale }: ChallengesWidgetProps) {
  const { data, isLoading } = useQuery<{ data: ChallengesResponse }>({
    queryKey: queryKeys.guide.challenges(),
    queryFn: async () => {
      const res = await fetch('/api/guide/challenges');
      if (!res.ok) throw new Error('Failed to fetch challenges');
      const json = await res.json();
      // API returns { data: { challenges: [...] } }, so we need to extract it
      return json;
    },
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div>
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          CHALLENGES
        </h2>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const challenges = data?.data?.challenges || [];
  const activeChallenges = challenges.filter((c) => c.status === 'active').slice(0, 2);

  // Show empty state if no active challenges
  if (activeChallenges.length === 0) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            CHALLENGES
          </h2>
          <Link
            href={`/${locale}/guide/challenges`}
            className="text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700"
          >
            Lihat Semua
          </Link>
        </div>
        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-600">
              Belum ada challenge aktif. Challenge akan muncul di sini.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getProgress = (challenge: Challenge) => {
    const current = challenge.current ?? challenge.current_value ?? 0;
    const target = challenge.target ?? challenge.target_value ?? 1;
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          CHALLENGES
        </h2>
        <Link
          href={`/${locale}/guide/challenges`}
          className="text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700"
        >
          Lihat Semua
        </Link>
      </div>
      <div className="space-y-2">
        {activeChallenges.map((challenge) => {
          const progress = getProgress(challenge);
          return (
            <Link
              key={challenge.id}
              href={`/${locale}/guide/challenges`}
              className="block transition-transform active:scale-[0.98]"
            >
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 flex-shrink-0 text-blue-600" />
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {challenge.title || challengeTypeLabels[challenge.challenge_type || challenge.type || ''] || challenge.challenge_type || challenge.type || 'Challenge'}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <Progress value={progress} className="h-1.5" />
                        <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                          <span>
                            {(challenge.current ?? challenge.current_value ?? 0).toLocaleString('id-ID')} / {(challenge.target ?? challenge.target_value ?? 0).toLocaleString('id-ID')}
                          </span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                      </div>
                    </div>
                    {(challenge.reward || challenge.reward_amount) && (
                      <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <Trophy className="h-3.5 w-3.5" />
                        <span>
                          {challenge.reward_amount 
                            ? `Rp ${challenge.reward_amount.toLocaleString('id-ID')}`
                            : challenge.reward || 'Reward'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

