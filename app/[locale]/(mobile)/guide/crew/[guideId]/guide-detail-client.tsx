'use client';

/**
 * Guide Detail Client Component
 * Menampilkan detail profil tour guide
 */

import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    Award,
    BarChart3,
    Calendar,
    HelpCircle,
    MapPin,
    Phone,
    Shield,
    Star,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Progress } from '@/components/ui/progress';
import { getLevelInfo } from '@/lib/guide/gamification';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type GuideProfile = {
  user_id: string;
  display_name: string;
  photo_url: string | null;
  badges: Array<{ name: string; level?: string }> | null;
  skills: Array<{ name: string; level?: number }> | null;
  current_availability: 'available' | 'on_duty' | 'on_trip' | 'not_available' | 'unknown';
  last_status_update: string | null;
  contact_enabled: boolean;
  is_active: boolean;
  updated_at: string;
  branch?: {
    id: string;
    code: string;
    name: string;
  } | null;
};

type UserInfo = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
};

type TripAssignment = {
  id: string;
  trip_id: string;
  guide_role: string;
  assignment_status: string;
  trip: {
    id: string;
    trip_code: string;
    departure_date: string;
    return_date: string;
  } | null;
};

type GuideStats = {
  totalTrips: number;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: { '5': number; '4': number; '3': number; '2': number; '1': number };
  currentLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  yearsOfExperience: number;
};

type GuideSkill = {
  id: string;
  name: string;
  category: string;
  level: number;
  certified: boolean;
  validated: boolean;
};

type TripStatistics = {
  topDestinations: Array<{ destination: string; count: number }>;
  tripTypes: Array<{ type: string; count: number }>;
  totalCompleted: number;
};

type GuideDetailResponse = {
  profile: GuideProfile;
  user: UserInfo | null;
  currentTrips: TripAssignment[];
  stats: GuideStats | null;
  skills: GuideSkill[];
  performanceTier: 'excellent' | 'good' | 'average' | 'needs_improvement' | null;
  leaderboardRank: number | null;
  totalGuidesInBranch: number;
  tripStatistics: TripStatistics | null;
};

type GuideDetailClientProps = {
  guideId: string;
  locale: string;
};

const availabilityLabels: Record<string, string> = {
  available: 'Tersedia',
  on_duty: 'On Duty',
  on_trip: 'Sedang Trip',
  not_available: 'Tidak Tersedia',
  unknown: 'Unknown',
};

const availabilityColors: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700',
  on_duty: 'bg-blue-100 text-blue-700',
  on_trip: 'bg-amber-100 text-amber-700',
  not_available: 'bg-slate-100 text-slate-600',
  unknown: 'bg-slate-100 text-slate-500',
};

export function GuideDetailClient({ guideId, locale }: GuideDetailClientProps) {
  const params = useParams();
  const localeParam = (params?.locale as string) || locale;

  const { data, isLoading, error, refetch } = useQuery<GuideDetailResponse>({
    queryKey: queryKeys.guide.team.directory.detail(guideId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/crew/${guideId}`);
      if (!res.ok) {
        throw new Error('Gagal memuat detail guide');
      }
      return (await res.json()) as GuideDetailResponse;
    },
  });

  const handleContact = async () => {
    try {
      const res = await fetch(`/api/guide/crew/contact/${guideId}`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Gagal mendapatkan kontak');
      }
      const contactData = (await res.json()) as {
        actions: { call?: string | null; whatsapp?: string | null };
      };

      if (contactData.actions.whatsapp) {
        window.open(contactData.actions.whatsapp, '_blank');
      } else if (contactData.actions.call) {
        window.location.href = contactData.actions.call;
      }
    } catch (error) {
      logger.error('Contact error', error, { guideId });
      alert('Gagal menghubungi guide');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <LoadingState variant="spinner" message="Memuat detail guide..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <ErrorState
              message={error instanceof Error ? error.message : 'Gagal memuat detail guide'}
              onRetry={() => void refetch()}
              variant="card"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <EmptyState
              icon={Users}
              title="Guide tidak ditemukan"
              description="Guide yang Anda cari tidak ditemukan atau tidak memiliki akses"
              variant="subtle"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { profile, user, currentTrips, stats, skills, performanceTier, leaderboardRank, totalGuidesInBranch, tripStatistics } = data;
  
  if (!profile || !profile.user_id || !profile.display_name) {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <EmptyState
              icon={Users}
              title="Guide tidak ditemukan"
              description="Data guide tidak lengkap"
              variant="subtle"
            />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const availability = profile.current_availability || 'unknown';
  const availabilityLabel = availabilityLabels[availability] || availability;
  const availabilityColor = availabilityColors[availability] || availabilityColors.unknown;
  
  // Filter out invalid trips and skills
  const validTrips = (currentTrips || []).filter((t) => t && t.id && t.trip_id);
  const validSkills = (skills || []).filter((s) => s && s.id && s.name);

  // Performance tier colors
  const tierColors: Record<string, string> = {
    excellent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    good: 'bg-blue-100 text-blue-700 border-blue-200',
    average: 'bg-amber-100 text-amber-700 border-amber-200',
    needs_improvement: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const tierLabels: Record<string, string> = {
    excellent: 'Excellent',
    good: 'Good',
    average: 'Average',
    needs_improvement: 'Needs Improvement',
  };

  // Level info - ensure safe access with default
  const safeCurrentLevel = stats?.currentLevel || 'bronze';
  const levelInfo = getLevelInfo(safeCurrentLevel);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${localeParam}/guide/crew/directory`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Detail Guide</h1>
      </div>

      {/* Profile Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.display_name}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Users className="h-10 w-10" />
                </div>
              )}
              <div
                className={cn(
                  'absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white',
                  availability === 'available' && 'bg-emerald-500',
                  availability === 'on_duty' && 'bg-blue-500',
                  availability === 'on_trip' && 'bg-amber-500',
                  availability === 'not_available' && 'bg-slate-400',
                  availability === 'unknown' && 'bg-slate-300',
                )}
                title={availabilityLabel}
              />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-slate-900">{profile.display_name}</h2>
                  {user && (
                    <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                  )}
                  {profile.branch && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                      <MapPin className="h-4 w-4" />
                      {profile.branch.name} ({profile.branch.code})
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    'flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium',
                    availabilityColor,
                  )}
                >
                  {availabilityLabel}
                </span>
              </div>

              {/* Contact Button */}
              {profile.contact_enabled && (
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleContact}
                    className="h-9"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Hubungi
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      {stats && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Performance Tier */}
            {performanceTier && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-slate-500">Performance Tier</p>
                    <div title="Tingkat performa berdasarkan kombinasi rating, jumlah trip, dan metrics lainnya. Excellent = performa sangat baik, Good = baik, Average = rata-rata, Needs Improvement = perlu peningkatan.">
                      <HelpCircle className="h-3 w-3 text-slate-400" />
                    </div>
                  </div>
                  <p className="mt-1 font-semibold text-slate-900">{tierLabels[performanceTier]}</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {performanceTier === 'excellent' && 'Performa sangat baik, sangat reliable untuk trip besar'}
                    {performanceTier === 'good' && 'Performa baik, dapat diandalkan untuk berbagai jenis trip'}
                    {performanceTier === 'average' && 'Performa rata-rata, cocok untuk trip standar'}
                    {performanceTier === 'needs_improvement' && 'Perlu peningkatan, disarankan untuk trip kecil terlebih dahulu'}
                  </p>
                </div>
                <span
                  className={cn(
                    'flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium',
                    tierColors[performanceTier] || tierColors.average,
                  )}
                >
                  {tierLabels[performanceTier]}
                </span>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-1">
                  <p className="text-xs text-slate-500">Total Trips</p>
                  <div title="Total trip yang sudah diselesaikan oleh guide ini">
                    <HelpCircle className="h-3 w-3 text-slate-400" />
                  </div>
                </div>
                <p className="mt-1 text-lg font-bold text-slate-900">{stats.totalTrips ?? 0}</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {(stats.totalTrips ?? 0) >= 100
                    ? 'Sangat berpengalaman'
                    : (stats.totalTrips ?? 0) >= 50
                      ? 'Berpengalaman'
                      : (stats.totalTrips ?? 0) >= 20
                        ? 'Cukup berpengalaman'
                        : (stats.totalTrips ?? 0) >= 10
                          ? 'Mulai berpengalaman'
                          : 'Pemula'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-1">
                  <p className="text-xs text-slate-500">Years Experience</p>
                  <div title="Lama bergabung sebagai guide (dihitung dari join date)">
                    <HelpCircle className="h-3 w-3 text-slate-400" />
                  </div>
                </div>
                <p className="mt-1 text-lg font-bold text-slate-900">{stats.yearsOfExperience ?? 0}</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {(stats.yearsOfExperience ?? 0) >= 5
                    ? 'Veteran guide'
                    : (stats.yearsOfExperience ?? 0) >= 3
                      ? 'Senior guide'
                      : (stats.yearsOfExperience ?? 0) >= 1
                        ? 'Experienced'
                        : 'New guide'}
                </p>
              </div>
            </div>

            {/* Leaderboard Rank */}
            {leaderboardRank && leaderboardRank > 0 && totalGuidesInBranch > 0 && (
              <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-3">
                <div className="flex items-center gap-1">
                  <p className="text-xs text-slate-600">Leaderboard Rank</p>
                  <div title="Peringkat guide ini di branch berdasarkan performance (rating & trips). Ranking lebih rendah = lebih baik.">
                    <HelpCircle className="h-3 w-3 text-slate-400" />
                  </div>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Ranked #{leaderboardRank} of {totalGuidesInBranch} guides
                  {leaderboardRank <= 5 && (
                    <span className="ml-2 text-xs text-purple-600">🏆 Top Performer</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Top {totalGuidesInBranch > 0 ? Math.round((leaderboardRank / totalGuidesInBranch) * 100) : 0}% of guides
                  {leaderboardRank <= 3 && ' • Excellent'}
                  {leaderboardRank > 3 && leaderboardRank <= 10 && ' • Very Good'}
                  {leaderboardRank > 10 && leaderboardRank <= 20 && ' • Good'}
                  {leaderboardRank > 20 && ' • Average'}
                </p>
              </div>
            )}

            {/* Current Level */}
            {levelInfo && (
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-slate-500">Current Level</p>
                      <div title="Level guide berdasarkan total trip yang sudah diselesaikan. Bronze (0-9), Silver (10-24), Gold (25-49), Platinum (50-99), Diamond (100+). Level lebih tinggi menunjukkan pengalaman lebih banyak.">
                        <HelpCircle className="h-3 w-3 text-slate-400" />
                      </div>
                    </div>
                    <p className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
                      <span className="text-lg">{levelInfo.icon}</span>
                      {levelInfo.name}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {safeCurrentLevel === 'diamond' && 'Level tertinggi - Expert guide dengan pengalaman sangat banyak'}
                      {safeCurrentLevel === 'platinum' && 'Level tinggi - Senior guide berpengalaman'}
                      {safeCurrentLevel === 'gold' && 'Level menengah - Guide berpengalaman'}
                      {safeCurrentLevel === 'silver' && 'Level sedang - Guide dengan pengalaman cukup'}
                      {safeCurrentLevel === 'bronze' && 'Level awal - Guide baru atau sedang berkembang'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rating & Reviews */}
      {stats && (stats.totalRatings ?? 0) > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Star className="h-5 w-5 text-amber-600" />
              Rating & Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Average Rating */}
            <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3">
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-xs text-amber-700">Average Rating</p>
                  <div title="Rata-rata rating dari semua review customer. Skala 1-5, semakin tinggi semakin baik. Rating tinggi menunjukkan kepuasan customer yang baik.">
                    <HelpCircle className="h-3 w-3 text-amber-600" />
                  </div>
                </div>
                <p className="mt-1 flex items-center gap-2">
                  <span className="text-2xl font-bold text-amber-900">{(stats.averageRating ?? 0).toFixed(1)}</span>
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                </p>
                <p className="mt-1 text-[10px] text-amber-700">
                  {(stats.averageRating ?? 0) >= 4.5
                    ? '⭐ Excellent - Sangat direkomendasikan'
                    : (stats.averageRating ?? 0) >= 4.0
                      ? '⭐ Very Good - Sangat baik'
                      : (stats.averageRating ?? 0) >= 3.5
                        ? '⭐ Good - Baik'
                        : (stats.averageRating ?? 0) >= 3.0
                          ? '⭐ Fair - Cukup baik'
                          : '⭐ Needs Improvement - Perlu peningkatan'}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <p className="text-xs text-amber-700">Total Reviews</p>
                  <div title="Jumlah total review yang diberikan customer untuk guide ini. Semakin banyak review, semakin reliable rating-nya.">
                    <HelpCircle className="h-3 w-3 text-amber-600" />
                  </div>
                </div>
                <p className="mt-1 text-lg font-semibold text-amber-900">{stats.totalRatings ?? 0}</p>
                <p className="mt-1 text-[10px] text-amber-700">
                  {(stats.totalRatings ?? 0) >= 50
                    ? 'Banyak review'
                    : (stats.totalRatings ?? 0) >= 20
                      ? 'Cukup review'
                      : (stats.totalRatings ?? 0) >= 10
                        ? 'Sedang'
                        : 'Sedikit review'}
                </p>
              </div>
            </div>

            {/* Rating Distribution */}
            {stats.ratingDistribution && (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium text-slate-600">Rating Distribution</p>
                  <div title="Distribusi rating menunjukkan sebaran review. Semakin banyak 5⭐ dan 4⭐, semakin baik. Jika banyak 1⭐ atau 2⭐, perlu perhatian.">
                    <HelpCircle className="h-3 w-3 text-slate-400" />
                  </div>
                </div>
                {(() => {
                  const totalRatings = stats.totalRatings ?? 0;
                  return (
                    <>
                      {(['5', '4', '3', '2', '1'] as const).map((rating) => {
                        const count = stats.ratingDistribution[rating] ?? 0;
                        const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                        return (
                          <div key={rating} className="flex items-center gap-2">
                            <div className="flex w-8 items-center gap-1">
                              <span className="text-xs font-medium text-slate-600">{rating}</span>
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            </div>
                            <div className="flex-1">
                              <Progress value={percentage} className="h-2" />
                            </div>
                            <div className="flex w-16 items-center justify-end gap-1">
                              <span className="text-right text-xs text-slate-600">{count}</span>
                              {totalRatings > 0 && (
                                <span className="text-[10px] text-slate-400">
                                  ({percentage.toFixed(0)}%)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {/* Summary */}
                      {totalRatings > 0 && stats.ratingDistribution && (
                        <div className="mt-2 rounded-lg bg-slate-50 p-2">
                          <p className="text-[10px] text-slate-600">
                            {(stats.ratingDistribution['5'] ?? 0) + (stats.ratingDistribution['4'] ?? 0) >= totalRatings * 0.8
                              ? '✅ Mayoritas customer sangat puas (80%+ rating 4-5⭐)'
                              : (stats.ratingDistribution['5'] ?? 0) + (stats.ratingDistribution['4'] ?? 0) >= totalRatings * 0.6
                                ? '✅ Sebagian besar customer puas (60%+ rating 4-5⭐)'
                                : (stats.ratingDistribution['1'] ?? 0) + (stats.ratingDistribution['2'] ?? 0) >= totalRatings * 0.3
                                  ? '⚠️ Perhatian (30%+ rating rendah)'
                                  : '✅ Distribusi rating normal'}
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Skills & Certifications (Enhanced) */}
      {(validSkills.length > 0) || (profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0) ? (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Shield className="h-5 w-5 text-blue-600" />
              Skills & Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Guide Skills from guide_skills table */}
            {validSkills.length > 0 && (
              <div className="mb-4 space-y-3">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium text-slate-600">Skills dari Sistem</p>
                  <div title="Skills yang sudah terdaftar dan divalidasi di sistem. Certified = memiliki sertifikat resmi, Validated = sudah diverifikasi oleh admin/ops.">
                    <HelpCircle className="h-3 w-3 text-slate-400" />
                  </div>
                </div>
                {validSkills.map((skill) => {
                  if (!skill || !skill.id) return null;
                  const skillName = skill.name || 'Skill';
                  const skillLevel = skill.level ?? 0;
                  const skillCategory = skill.category || 'General';
                  return (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{skillName}</span>
                          {skill.certified && (
                            <span
                              className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
                              title="Memiliki sertifikat resmi untuk skill ini"
                            >
                              Certified
                            </span>
                          )}
                          {skill.validated && (
                            <span
                              className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                              title="Sudah diverifikasi oleh admin/ops"
                            >
                              Validated
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Level {skillLevel} • {skillCategory}
                          {skillLevel >= 4 && ' • Expert'}
                          {skillLevel === 3 && ' • Advanced'}
                          {skillLevel === 2 && ' • Intermediate'}
                          {skillLevel === 1 && ' • Beginner'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Badges from profile (fallback) */}
            {profile.badges && Array.isArray(profile.badges) && profile.badges.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-600">Badges</p>
                <div className="flex flex-wrap gap-2">
                  {profile.badges
                    .filter((badge) => badge && badge.name)
                    .map((badge, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
                      >
                        {badge.name}
                        {badge.level && ` (${badge.level})`}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Skills from profile (fallback) */}
            {profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-slate-600">Additional Skills</p>
                <div className="flex flex-wrap gap-2">
                  {profile.skills
                    .filter((skill) => skill && skill.name)
                    .map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
                      >
                        {skill.name}
                        {skill.level && ` Lv.${skill.level}`}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Achievements */}
      {stats && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Award className="h-5 w-5 text-purple-600" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Level Badge */}
            {levelInfo && (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl">
                  {levelInfo.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{levelInfo.name} Level</p>
                  <p className="text-xs text-slate-600">{stats.totalTrips ?? 0} trips completed</p>
                </div>
              </div>
            )}

            {/* Badges from profile */}
            {profile.badges && Array.isArray(profile.badges) && profile.badges.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-600">Earned Badges</p>
                <div className="flex flex-wrap gap-2">
                  {profile.badges
                    .filter((badge) => badge && badge.name)
                    .map((badge, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
                      >
                        {badge.name}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trip Statistics */}
      {tripStatistics && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="h-5 w-5 text-amber-600" />
              Trip Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total Completed */}
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-1">
                <p className="text-xs text-slate-500">Total Completed Trips</p>
                <div title="Total trip yang sudah diselesaikan dengan sukses. Menunjukkan pengalaman dan reliability guide.">
                  <HelpCircle className="h-3 w-3 text-slate-400" />
                </div>
              </div>
              <p className="mt-1 text-lg font-bold text-slate-900">{tripStatistics.totalCompleted ?? 0}</p>
              <p className="mt-1 text-[10px] text-slate-500">
                {(tripStatistics.totalCompleted ?? 0) >= 100
                  ? 'Sangat berpengalaman - Expert level'
                  : (tripStatistics.totalCompleted ?? 0) >= 50
                    ? 'Berpengalaman - Senior level'
                    : (tripStatistics.totalCompleted ?? 0) >= 20
                      ? 'Cukup berpengalaman - Mid level'
                      : (tripStatistics.totalCompleted ?? 0) >= 10
                        ? 'Mulai berpengalaman - Junior level'
                        : 'Pemula - New guide'}
              </p>
            </div>

            {/* Top Destinations */}
            {tripStatistics.topDestinations && Array.isArray(tripStatistics.topDestinations) && tripStatistics.topDestinations.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1">
                  <p className="text-xs font-medium text-slate-600">Favorite Destinations</p>
                  <div title="Destinasi yang paling sering ditangani guide ini. Berguna untuk mengetahui spesialisasi atau pengalaman di area tertentu.">
                    <HelpCircle className="h-3 w-3 text-slate-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  {tripStatistics.topDestinations
                    .filter((dest) => dest && dest.destination)
                    .map((dest, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-900">{dest.destination}</span>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {idx === 0 && '📍 Paling sering'}
                            {idx === 1 && '📍 Sering'}
                            {idx === 2 && '📍 Cukup sering'}
                          </p>
                        </div>
                        <span className="text-xs text-slate-500">{dest.count ?? 0} trips</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Trip Types */}
            {tripStatistics.tripTypes && Array.isArray(tripStatistics.tripTypes) && tripStatistics.tripTypes.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1">
                  <p className="text-xs font-medium text-slate-600">Trip Types</p>
                  <div title="Jenis trip yang paling sering ditangani. Berguna untuk mengetahui spesialisasi guide (domestic, international, adventure, dll).">
                    <HelpCircle className="h-3 w-3 text-slate-400" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tripStatistics.tripTypes
                    .filter((type) => type && type.type)
                    .map((type, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 capitalize"
                      >
                        {type.type} ({type.count ?? 0})
                        {idx === 0 && ' • Spesialisasi'}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Trips */}
      {validTrips.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Calendar className="h-5 w-5 text-amber-600" />
              Trip Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {validTrips.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      {assignment.trip && (
                        <>
                          <Link
                            href={`/${localeParam}/guide/trips/${assignment.trip.trip_code}`}
                            className="font-semibold text-slate-900 hover:text-emerald-600"
                          >
                            {assignment.trip.trip_code}
                          </Link>
                          <p className="mt-1 text-xs text-slate-600">
                            {assignment.guide_role === 'lead' ? 'Lead Guide' : 'Support Guide'}
                          </p>
                          {assignment.trip.departure_date && (
                            <p className="mt-1 text-xs text-slate-500">
                              {new Date(assignment.trip.departure_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <span
                      className={cn(
                        'flex-shrink-0 rounded-full px-2 py-1 text-[10px] font-medium capitalize',
                        assignment.assignment_status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700',
                      )}
                    >
                      {assignment.assignment_status === 'confirmed' ? 'Confirmed' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Info */}
      {profile.last_status_update && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">
              Status terakhir diupdate:{' '}
              {new Date(profile.last_status_update).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
