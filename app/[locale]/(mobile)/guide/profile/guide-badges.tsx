'use client';

/**
 * Guide Badges & Level Component
 * Menampilkan level, progress, dan badges guide
 */

import { Award, ChevronRight, Star, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { Progress } from '@/components/ui/progress';
import { getLevelInfo, type GuideLevel, type GuideStats } from '@/lib/guide/gamification';
import { cn } from '@/lib/utils';

type GuideBadgesProps = {
  locale: string;
};

export function GuideBadges({ locale: _locale }: GuideBadgesProps) {
  const [stats, setStats] = useState<GuideStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/guide/stats');
        if (!res.ok) return;
        const data = (await res.json()) as GuideStats;
        if (mounted) {
          setStats(data);
        }
      } catch {
        // Set default stats if API fails
        if (mounted) {
          setStats({
            totalTrips: 0,
            averageRating: 0,
            totalRatings: 0,
            complaints: 0,
            penalties: 0,
            currentLevel: 'bronze',
            currentLevelProgress: 0,
            nextLevelTripsRequired: 10,
            badges: [],
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-sm">
        <CardContent className="p-4">
          <LoadingState variant="skeleton" lines={2} />
        </CardContent>
      </Card>
    );
  }

  // Default stats if API fails or returns no data
  const displayStats: GuideStats = stats || {
    totalTrips: 0,
    averageRating: 0,
    totalRatings: 0,
    complaints: 0,
    penalties: 0,
    currentLevel: 'bronze',
    currentLevelProgress: 0,
    nextLevelTripsRequired: 10,
    badges: [],
  };

  // Ensure currentLevel exists, default to bronze if undefined
  const currentLevel = displayStats.currentLevel || 'bronze';
  const levelInfo = getLevelInfo(currentLevel);

  return (
    <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-sm transition-all hover:shadow-md active:scale-[0.99] cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Level & Badge</h3>
          <ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        {/* Level Display */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-3xl shadow-md',
              levelInfo.color,
            )}
          >
            {levelInfo.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">{levelInfo.name}</span>
              <Trophy className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-xs text-slate-600">
              {displayStats.totalTrips} trip selesai
              {displayStats.totalRatings > 0 && (
                <>
                  {' • '}
                  <span className="inline-flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {displayStats.averageRating.toFixed(1)}
                  </span>
                  {' '}({displayStats.totalRatings} review)
                </>
              )}
            </p>
            {displayStats.nextLevelTripsRequired > 0 && (
              <div className="mt-2">
                <Progress value={displayStats.currentLevelProgress} className="h-1.5" />
                {(() => {
                  const levels: GuideLevel[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
                  const safeCurrentLevel = displayStats.currentLevel || 'bronze';
                  const currentIndex = levels.indexOf(safeCurrentLevel);
                  const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
                  const nextLevelInfo = nextLevel ? getLevelInfo(nextLevel) : null;
                  return nextLevelInfo ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {displayStats.nextLevelTripsRequired} trip lagi untuk level {nextLevelInfo.name}
                    </p>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        {displayStats.badges.length > 0 && (
          <div className="mt-4 border-t border-emerald-200 pt-4">
            <div className="mb-2 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Badges ({displayStats.badges.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {displayStats.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 shadow-sm"
                  title={badge.description}
                >
                  <span className="text-base">{badge.icon}</span>
                  <span className="text-xs font-medium text-slate-700">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
