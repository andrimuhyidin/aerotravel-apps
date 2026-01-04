/**
 * Level Benefits
 * Informasi benefit yang didapat guide berdasarkan level
 */

import type { GuideLevel } from './gamification';

export type LevelBenefit = {
  id: string;
  label: string;
  icon: string;
};

export type LevelBenefits = {
  level: GuideLevel;
  benefits: LevelBenefit[];
  description: string;
};

export const LEVEL_BENEFITS: Record<GuideLevel, LevelBenefits> = {
  bronze: {
    level: 'bronze',
    description: 'Level awal untuk semua guide',
    benefits: [
      { id: 'access', label: 'Akses ke semua fitur dasar', icon: '🔓' },
      { id: 'wallet', label: 'Sistem dompet & pembayaran', icon: '💰' },
      { id: 'rating', label: 'Sistem rating & review', icon: '⭐' },
    ],
  },
  silver: {
    level: 'silver',
    description: 'Guide berpengalaman dengan 10+ trip',
    benefits: [
      { id: 'all_bronze', label: 'Semua benefit Bronze', icon: '✅' },
      { id: 'priority', label: 'Prioritas penugasan trip', icon: '🎯' },
      { id: 'badge', label: 'Badge Silver di profile', icon: '🥈' },
      { id: 'bonus', label: 'Eligible untuk bonus trip', icon: '💵' },
    ],
  },
  gold: {
    level: 'gold',
    description: 'Guide ahli dengan 25+ trip',
    benefits: [
      { id: 'all_silver', label: 'Semua benefit Silver', icon: '✅' },
      { id: 'higher_rate', label: 'Rate pembayaran lebih tinggi', icon: '📈' },
      { id: 'leaderboard', label: 'Tampil di leaderboard', icon: '🏆' },
      { id: 'training', label: 'Akses training eksklusif', icon: '📚' },
      { id: 'recognition', label: 'Pengakuan sebagai Top Guide', icon: '🌟' },
    ],
  },
  platinum: {
    level: 'platinum',
    description: 'Guide master dengan 50+ trip',
    benefits: [
      { id: 'all_gold', label: 'Semua benefit Gold', icon: '✅' },
      { id: 'premium_rate', label: 'Rate premium tertinggi', icon: '💎' },
      { id: 'mentor', label: 'Menjadi mentor guide baru', icon: '👨‍🏫' },
      { id: 'exclusive', label: 'Akses trip eksklusif', icon: '🎁' },
      { id: 'award', label: 'Eligible untuk Annual Award', icon: '🏅' },
    ],
  },
  diamond: {
    level: 'diamond',
    description: 'Level tertinggi untuk guide legenda',
    benefits: [
      { id: 'all_platinum', label: 'Semua benefit Platinum', icon: '✅' },
      { id: 'maximum_rate', label: 'Rate maksimal tertinggi', icon: '💰' },
      { id: 'legend', label: 'Status Guide Legenda', icon: '👑' },
      { id: 'partnership', label: 'Eligible partnership khusus', icon: '🤝' },
      { id: 'annual_award', label: 'Prioritas Annual Award', icon: '🎖️' },
      { id: 'exclusive_benefit', label: 'Benefit eksklusif Diamond', icon: '💠' },
    ],
  },
};

/**
 * Get benefits for a specific level
 */
export function getLevelBenefits(level: GuideLevel): LevelBenefits {
  return LEVEL_BENEFITS[level];
}

/**
 * Get all benefits text for display
 */
export function getLevelBenefitsText(level: GuideLevel): string {
  const benefits = getLevelBenefits(level);
  return benefits.benefits.map((b) => b.label).join(', ');
}
