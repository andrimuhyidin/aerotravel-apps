/**
 * Guide Gamification System
 * Badge, level, dan leaderboard calculation
 */

export type GuideLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export type GuideBadge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
};

export type GuideStats = {
  totalTrips: number;
  averageRating: number;
  totalRatings: number;
  complaints: number;
  penalties: number;
  currentLevel: GuideLevel;
  currentLevelProgress: number; // 0-100
  nextLevelTripsRequired: number;
  badges: GuideBadge[];
};

/**
 * Calculate guide level based on total trips completed
 */
export function calculateLevel(totalTrips: number): GuideLevel {
  if (totalTrips >= 100) return 'diamond';
  if (totalTrips >= 50) return 'platinum';
  if (totalTrips >= 25) return 'gold';
  if (totalTrips >= 10) return 'silver';
  return 'bronze';
}

/**
 * Get level display info
 */
export function getLevelInfo(level: GuideLevel | undefined | null) {
  const levels = {
    bronze: {
      name: 'Bronze',
      color: 'bg-amber-600',
      icon: '🥉',
      minTrips: 0,
      maxTrips: 9,
    },
    silver: {
      name: 'Silver',
      color: 'bg-slate-400',
      icon: '🥈',
      minTrips: 10,
      maxTrips: 24,
    },
    gold: {
      name: 'Gold',
      color: 'bg-amber-500',
      icon: '🥇',
      minTrips: 25,
      maxTrips: 49,
    },
    platinum: {
      name: 'Platinum',
      color: 'bg-emerald-600',
      icon: '💎',
      minTrips: 50,
      maxTrips: 99,
    },
    diamond: {
      name: 'Diamond',
      color: 'bg-blue-500',
      icon: '💠',
      minTrips: 100,
      maxTrips: Infinity,
    },
  };

  // Default to bronze if level is invalid or undefined
  if (!level || !(level in levels)) {
    return levels.bronze;
  }

  return levels[level];
}

/**
 * Calculate level progress percentage
 */
export function calculateLevelProgress(currentTrips: number, level: GuideLevel): number {
  const levelInfo = getLevelInfo(level);
  const nextLevelInfo = getNextLevelInfo(level);

  if (!nextLevelInfo) return 100; // Already at max level

  const tripsInCurrentLevel = currentTrips - levelInfo.minTrips;
  const tripsNeededForNextLevel = nextLevelInfo.minTrips - levelInfo.minTrips;

  if (tripsNeededForNextLevel === 0) return 100;

  return Math.min(100, Math.round((tripsInCurrentLevel / tripsNeededForNextLevel) * 100));
}

/**
 * Get next level info
 */
export function getNextLevelInfo(currentLevel: GuideLevel): ReturnType<typeof getLevelInfo> | null {
  const levels: GuideLevel[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const currentIndex = levels.indexOf(currentLevel);
  if (currentIndex === levels.length - 1) return null;
  return getLevelInfo(levels[currentIndex + 1]!);
}

/**
 * Calculate badges earned by guide
 */
export function calculateBadges(stats: {
  totalTrips: number;
  averageRating: number;
  totalRatings: number;
  complaints: number;
  penalties: number;
}): GuideBadge[] {
  const badges: GuideBadge[] = [
    {
      id: 'first_trip',
      name: 'Pertama Kali',
      description: 'Menyelesaikan trip pertama',
      icon: '🎯',
      earned: stats.totalTrips >= 1,
    },
    {
      id: 'rookie',
      name: 'Pemula',
      description: 'Menyelesaikan 5 trip',
      icon: '🌱',
      earned: stats.totalTrips >= 5,
    },
    {
      id: 'experienced',
      name: 'Berpengalaman',
      description: 'Menyelesaikan 25 trip',
      icon: '⭐',
      earned: stats.totalTrips >= 25,
    },
    {
      id: 'expert',
      name: 'Ahli',
      description: 'Menyelesaikan 50 trip',
      icon: '🏆',
      earned: stats.totalTrips >= 50,
    },
    {
      id: 'master',
      name: 'Master',
      description: 'Menyelesaikan 100 trip',
      icon: '👑',
      earned: stats.totalTrips >= 100,
    },
    {
      id: 'five_star',
      name: 'Bintang Lima',
      description: 'Rating rata-rata 5.0 dari minimal 5 review',
      icon: '🌟',
      earned: stats.averageRating >= 5.0 && stats.totalRatings >= 5,
    },
    {
      id: 'excellent_service',
      name: 'Layanan Prima',
      description: 'Rating rata-rata minimal 4.5 dari minimal 10 review',
      icon: '✨',
      earned: stats.averageRating >= 4.5 && stats.totalRatings >= 10,
    },
    {
      id: 'zero_complaints',
      name: 'Tanpa Keluhan',
      description: 'Tidak ada keluhan dalam 30 hari terakhir',
      icon: '🎖️',
      earned: stats.complaints === 0,
    },
    {
      id: 'clean_record',
      name: 'Catatan Bersih',
      description: 'Tidak ada penalty dalam 3 bulan terakhir',
      icon: '✅',
      earned: stats.penalties === 0,
    },
  ];

  return badges;
}

/**
 * Calculate trips needed for next level
 */
export function getTripsNeededForNextLevel(currentTrips: number, level: GuideLevel): number {
  const nextLevel = getNextLevelInfo(level);
  if (!nextLevel) return 0;
  const tripsNeeded = nextLevel.minTrips - currentTrips;
  return Math.max(0, tripsNeeded);
}
