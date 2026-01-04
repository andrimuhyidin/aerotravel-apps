'use client';

/**
 * Leaderboard Client Component
 * Menampilkan leaderboard bulanan dan level system guide
 */

import { useQuery } from '@tanstack/react-query';
import { Calendar, Medal, Star, TrendingUp, Trophy } from 'lucide-react';
import { useState } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import {
    getLevelInfo,
    type GuideLevel,
    type GuideStats
} from '@/lib/guide/gamification';
import { getLevelBenefits } from '@/lib/guide/level-benefits';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type LeaderboardEntry = {
  guideId: string;
  guideName: string;
  level: GuideLevel;
  averageRating: number;
  totalTrips: number;
  totalRatings?: number;
  rank: number;
};

type LeaderboardData = {
  leaderboard: LeaderboardEntry[];
  currentMonth?: string;
};

type LeaderboardClientProps = {
  locale: string;
  userId: string;
};

const ALL_LEVELS: GuideLevel[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export function LeaderboardClient({ locale: _locale, userId }: LeaderboardClientProps) {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7), // YYYY-MM format
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    };
  }).reverse();

  // Generate year options (last 5 years + current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Fetch leaderboard
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery<LeaderboardData>({
    queryKey: [...queryKeys.guide.leaderboard(), period, period === 'monthly' ? selectedMonth : selectedYear],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        ...(period === 'monthly' ? { month: selectedMonth } : { year: String(selectedYear) }),
      });
      const res = await fetch(`/api/guide/leaderboard?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load leaderboard');
      return (await res.json()) as LeaderboardData;
    },
    staleTime: 60000, // Cache 1 minute
  });

  // Fetch current guide stats
  const { data: currentStats } = useQuery<GuideStats & { joinDate?: string }>({
    queryKey: queryKeys.guide.stats(),
    queryFn: async () => {
      const res = await fetch('/api/guide/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      return (await res.json()) as GuideStats & { joinDate?: string };
    },
    staleTime: 60000,
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-7 w-7 text-amber-500" />;
      case 2:
        return <Medal className="h-7 w-7 text-slate-400" />;
      case 3:
        return <Medal className="h-7 w-7 text-amber-600" />;
      default:
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
            {rank}
          </div>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-amber-50 to-amber-100/50 border-amber-200';
      case 2:
        return 'from-slate-50 to-slate-100/50 border-slate-200';
      case 3:
        return 'from-amber-50/50 to-amber-100/30 border-amber-200/50';
      default:
        return 'from-white to-slate-50/50 border-slate-100';
    }
  };

  const currentLevel = currentStats?.currentLevel || 'bronze';
  const currentLevelInfo = getLevelInfo(currentLevel);
  
  // Ensure currentStats has default values
  const safeCurrentStats = currentStats ? {
    ...currentStats,
    totalTrips: currentStats.totalTrips ?? 0,
    averageRating: currentStats.averageRating ?? 0,
    totalRatings: currentStats.totalRatings ?? 0,
    currentLevelProgress: currentStats.currentLevelProgress ?? 0,
    nextLevelTripsRequired: currentStats.nextLevelTripsRequired ?? 0,
  } : null;

  return (
    <div className="space-y-4 pb-6">
      {/* Current Guide Summary */}
      {safeCurrentStats && (
        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-sm">
          <CardHeader className="pb-3">
            <h2 className="text-base font-semibold text-slate-900">Level & Progress Saya</h2>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Current Level */}
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-3xl shadow-md',
                  currentLevelInfo?.color || 'bg-amber-600',
                )}
              >
                {currentLevelInfo?.icon || '🥉'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900">
                    {currentLevelInfo?.name || 'Bronze'}
                  </span>
                  <Trophy className="h-4 w-4 text-amber-500" />
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {safeCurrentStats.totalTrips} trip selesai
                  {safeCurrentStats.totalRatings > 0 && (
                    <>
                      {' • '}
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {safeCurrentStats.averageRating.toFixed(1)}
                      </span>
                      {' '}({safeCurrentStats.totalRatings} review)
                    </>
                  )}
                </p>
                {safeCurrentStats.nextLevelTripsRequired > 0 && (
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-slate-600">Progress ke level berikutnya</span>
                      <span className="font-medium text-slate-700">
                        {safeCurrentStats.currentLevelProgress}%
                      </span>
                    </div>
                    <Progress value={safeCurrentStats.currentLevelProgress} className="h-2" />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Butuh {safeCurrentStats.nextLevelTripsRequired} trip lagi untuk naik level
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Level System Guide - Horizontal Scroll */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <h2 className="text-base font-semibold text-slate-900">Sistem Level</h2>
          <p className="mt-1 text-xs text-slate-500">
            Ketahui cara naik level dan benefit yang didapat setiap level
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3" style={{ width: 'max-content', minWidth: '100%' }}>
              {ALL_LEVELS.map((level, index) => {
                const levelInfo = getLevelInfo(level);
                const levelBenefits = getLevelBenefits(level);
                const safeCurrentLevel = safeCurrentStats?.currentLevel || 'bronze';
                const isCurrentLevel = safeCurrentLevel === level;
                const isUnlocked = safeCurrentStats
                  ? ALL_LEVELS.indexOf(safeCurrentLevel) >= index
                  : index === 0;

                return (
                  <div
                    key={level}
                    className={cn(
                      'flex min-w-[280px] max-w-[280px] flex-col rounded-xl border-2 p-4 transition-all',
                      isCurrentLevel
                        ? 'border-emerald-500 bg-emerald-50 shadow-md'
                        : isUnlocked
                          ? 'border-slate-200 bg-white'
                          : 'border-slate-100 bg-slate-50 opacity-60',
                    )}
                  >
                    {/* Level Header */}
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm',
                          levelInfo.color,
                          !isUnlocked && 'grayscale',
                        )}
                      >
                        {levelInfo.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-base font-bold',
                              isCurrentLevel ? 'text-emerald-700' : 'text-slate-900',
                            )}
                          >
                            {levelInfo.name}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {levelInfo.minTrips === 0 ? 'Level awal' : `${levelInfo.minTrips}+ trip`}
                        </p>
                        {isCurrentLevel && (
                          <span className="mt-1 inline-block rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">
                            Level Saat Ini
                          </span>
                        )}
                        {!isUnlocked && (
                          <span className="mt-1 inline-block rounded-full bg-slate-400 px-2 py-0.5 text-xs font-medium text-white">
                            Belum Terbuka
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <p className="mb-2 text-xs font-semibold text-slate-700">Syarat Naik Level:</p>
                      <p className="text-xs text-slate-600">
                        Butuh {levelInfo.minTrips === 0 ? '0' : levelInfo.minTrips}+ trip selesai
                      </p>
                      {levelInfo.maxTrips && levelInfo.maxTrips < Infinity && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          (Maksimal {levelInfo.maxTrips} trip untuk level ini)
                        </p>
                      )}
                    </div>

                    {/* Benefits */}
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <p className="mb-2 text-xs font-semibold text-slate-700">Benefit:</p>
                      <ul className="space-y-1.5">
                        {levelBenefits.benefits.map((benefit) => (
                          <li key={benefit.id} className="flex items-start gap-2 text-xs text-slate-600">
                            <span className="mt-0.5 flex-shrink-0 text-sm">{benefit.icon}</span>
                            <span className="leading-relaxed">{benefit.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Progress (only for current level) */}
                    {isCurrentLevel && safeCurrentStats && (
                      <div className="mt-3 border-t border-emerald-200 pt-3">
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-slate-600">Progress ke level berikutnya</span>
                          <span className="font-medium text-emerald-700">
                            {safeCurrentStats.currentLevelProgress}%
                          </span>
                        </div>
                        <Progress value={safeCurrentStats.currentLevelProgress} className="h-2" />
                        <p className="mt-1 text-xs text-slate-500">
                          {safeCurrentStats.nextLevelTripsRequired} trip lagi untuk naik level
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard with Filter */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-base font-semibold text-slate-900">
                Leaderboard {period === 'monthly' ? 'Bulanan' : 'Tahunan'}
              </h2>
              {period === 'monthly' ? (
                <p className="mt-1 text-xs text-slate-500">
                  Periode {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">Periode Tahun {selectedYear}</p>
              )}
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          {/* Period Filter */}
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPeriod('monthly')}
                className={cn(
                  'flex-1 rounded-lg border-2 px-3 py-2 text-xs font-semibold transition-all',
                  period === 'monthly'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                <Calendar className="mr-1.5 inline-block h-3.5 w-3.5" />
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setPeriod('yearly')}
                className={cn(
                  'flex-1 rounded-lg border-2 px-3 py-2 text-xs font-semibold transition-all',
                  period === 'yearly'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                <Trophy className="mr-1.5 inline-block h-3.5 w-3.5" />
                Tahunan
              </button>
            </div>

            {/* Date Selector */}
            {period === 'monthly' ? (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {leaderboardLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : !leaderboardData || leaderboardData.leaderboard.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Trophy}
                title="Belum ada data leaderboard"
                description="Leaderboard akan muncul setelah ada guide yang menyelesaikan trip pada bulan ini"
                variant="subtle"
              />
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboardData.leaderboard.map((entry) => {
                if (!entry || !entry.guideId) return null;
                const entryLevel = entry.level || 'bronze';
                const entryLevelInfo = getLevelInfo(entryLevel);
                const entryName = entry.guideName || 'Guide';
                const entryRating = entry.averageRating ?? 0;
                const entryTrips = entry.totalTrips ?? 0;
                const entryRank = entry.rank ?? 999;
                return (
                  <div
                    key={entry.guideId}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border-2 p-4 transition-all',
                      getRankColor(entryRank),
                      entryRank <= 3 && 'shadow-sm',
                    )}
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0">{getRankIcon(entryRank)}</div>

                    {/* Guide Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{entryName}</h3>
                        {entry.guideId === userId && (
                          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">
                            Anda
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <div
                            className={cn(
                              'flex h-5 w-5 items-center justify-center rounded text-xs',
                              entryLevelInfo.color,
                            )}
                          >
                            {entryLevelInfo.icon}
                          </div>
                          <span className="font-medium">{entryLevelInfo.name}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{entryRating.toFixed(1)}</span>
                        </div>
                        <span>{entryTrips} trip</span>
                      </div>
                    </div>

                    {/* Rank Badge for top 3 */}
                    {entryRank <= 3 && (
                      <div className="flex-shrink-0">
                        <div
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-bold',
                            entryRank === 1
                              ? 'bg-amber-500 text-white'
                              : entryRank === 2
                                ? 'bg-slate-400 text-white'
                                : 'bg-amber-600 text-white',
                          )}
                        >
                          #{entryRank}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
