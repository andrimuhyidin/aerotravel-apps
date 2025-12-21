/**
 * Reward Points Widget
 * Display current reward points balance on guide dashboard
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Coins, TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';

type RewardPointsData = {
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  expiredPoints: number;
  expiringSoon: {
    total: number;
    details: Array<{ points: number; expiresAt: string }>;
    warningDays: number;
  };
};

type RewardPointsWidgetProps = {
  locale: string;
};

export function RewardPointsWidget({ locale }: RewardPointsWidgetProps) {
  const { data, isLoading, error } = useQuery<RewardPointsData>({
    queryKey: queryKeys.guide.rewardPoints(),
    queryFn: async () => {
      const res = await fetch('/api/guide/rewards/points');
      if (!res.ok) throw new Error('Failed to fetch reward points');
      return res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <LoadingState variant="skeleton" lines={1} />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null; // Don't show widget if error
  }

  const hasExpiringPoints = data.expiringSoon.total > 0;

  return (
    <Link href={`/${locale}/guide/rewards`}>
      <Card className="border-0 shadow-sm transition-all hover:shadow-md active:scale-[0.99] cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Coins className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Reward Points
                  </p>
                  {hasExpiringPoints && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Expiring Soon
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold text-slate-900">
                    {data.balance.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-slate-500">poin</p>
                </div>
                {hasExpiringPoints && (
                  <p className="text-xs text-red-600 mt-1">
                    {data.expiringSoon.total.toLocaleString('id-ID')} poin akan kadaluarsa dalam 30 hari
                  </p>
                )}
              </div>
            </div>
            <TrendingUp className="h-5 w-5 text-slate-400 group-hover:text-amber-600 transition-colors flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

