'use client';

/**
 * Career Overview Widget
 * Compact version untuk Dashboard - menampilkan level, badges, dan certifications status
 */

import { useQuery } from '@tanstack/react-query';
import { Award, ChevronRight, Shield } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getLevelInfo, type GuideStats } from '@/lib/guide/gamification';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type CareerOverviewWidgetProps = {
  locale: string;
  variant?: 'compact' | 'detailed';
};

export function CareerOverviewWidget({ locale, variant = 'compact' }: CareerOverviewWidgetProps) {
  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<GuideStats & { joinDate?: string }>({
    queryKey: queryKeys.guide.stats(),
    queryFn: async () => {
      const res = await fetch('/api/guide/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json() as Promise<GuideStats & { joinDate?: string }>;
    },
    staleTime: 60000, // 1 minute
  });

  // Fetch certifications status
  const { data: certData, isLoading: certLoading } = useQuery<{
    certifications: Array<{ status: string; expiry_date: string }>;
    is_valid: boolean;
  }>({
    queryKey: queryKeys.guide.certifications?.all() || ['certifications'],
    queryFn: async () => {
      const res = await fetch('/api/guide/certifications');
      if (!res.ok) return { certifications: [], is_valid: false };
      return res.json();
    },
    staleTime: 300000, // 5 minutes
  });

  if (statsLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const levelInfo = getLevelInfo(stats.currentLevel);
  const validCerts = certData?.certifications.filter((c) => c.status === 'verified' && new Date(c.expiry_date) > new Date()).length || 0;
  const totalCerts = certData?.certifications.length || 0;
  const isValidCert = certData?.is_valid ?? false;

  if (variant === 'compact') {
    return (
      <Link href={`/${locale}/guide/profile`} className="block transition-transform active:scale-[0.98]">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 via-emerald-50 to-blue-50 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              {/* Level & Progress */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-lg', levelInfo.color, 'text-white')}>
                    {levelInfo.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">Level {levelInfo.name}</span>
                      {stats.badges.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-600">
                          <Award className="h-3 w-3" />
                          {stats.badges.length}
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={cn('h-full transition-all duration-300', levelInfo.color)}
                          style={{ width: `${stats.currentLevelProgress}%` }}
                          role="progressbar"
                          aria-valuenow={stats.currentLevelProgress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {stats.nextLevelTripsRequired > 0
                          ? `${stats.nextLevelTripsRequired} trip lagi untuk level berikutnya`
                          : 'Level maksimal tercapai'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Certifications Status */}
                {!certLoading && totalCerts > 0 && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                    <Shield className={cn('h-4 w-4', isValidCert ? 'text-emerald-600' : 'text-amber-600')} />
                    <span className="text-xs text-slate-600">
                      {validCerts}/{totalCerts} sertifikasi aktif
                    </span>
                  </div>
                )}
              </div>

              <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Detailed variant (untuk Profile page)
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 via-emerald-50 to-blue-50">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Level Section */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-2xl', levelInfo.color, 'text-white shadow-sm')}>
                {levelInfo.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">Level {levelInfo.name}</h3>
                <p className="text-sm text-slate-600">
                  {stats.totalTrips} trip selesai
                </p>
              </div>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={cn('h-full transition-all duration-300', levelInfo.color)}
                style={{ width: `${stats.currentLevelProgress}%` }}
                role="progressbar"
                aria-valuenow={stats.currentLevelProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="mt-2 text-xs text-slate-600">
              {stats.nextLevelTripsRequired > 0
                ? `${stats.nextLevelTripsRequired} trip lagi untuk level berikutnya`
                : 'Level maksimal tercapai'}
            </p>
          </div>

          {/* Badges Preview */}
          {stats.badges.length > 0 && (
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-900">Badges</span>
                <Link
                  href={`/${locale}/guide/leaderboard`}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Lihat semua
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.badges.slice(0, 6).map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1.5 border border-slate-200"
                    title={badge.description}
                  >
                    <span className="text-base">{badge.icon}</span>
                    <span className="text-xs font-medium text-slate-700">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications Status */}
          {!certLoading && totalCerts > 0 && (
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className={cn('h-5 w-5', isValidCert ? 'text-emerald-600' : 'text-amber-600')} />
                  <div>
                    <span className="text-sm font-semibold text-slate-900">Sertifikasi</span>
                    <p className="text-xs text-slate-600">{validCerts}/{totalCerts} aktif</p>
                  </div>
                </div>
                <Link
                  href={`/${locale}/guide/certifications`}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Kelola
                </Link>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
