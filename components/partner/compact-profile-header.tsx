/**
 * Compact Profile Header Component
 * Horizontal profile bar untuk dashboard (tidak seperti menu yang besar)
 */

import { Award, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type CompactProfileHeaderProps = {
  locale: string;
  profileData?: {
    name: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    avatar: string | null;
  };
  className?: string;
};

export function CompactProfileHeader({
  locale,
  profileData = {
    name: 'PT Travel Sejahtera',
    tier: 'gold',
    avatar: null,
  },
  className,
}: CompactProfileHeaderProps) {
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return 'from-slate-400 to-slate-600';
      case 'gold':
        return 'from-yellow-400 to-yellow-600';
      case 'silver':
        return 'from-gray-300 to-gray-500';
      default:
        return 'from-orange-400 to-orange-600';
    }
  };

  return (
    <Link
      href={`/${locale}/partner/account`}
      className={cn(
        'flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]',
        className
      )}
    >
      {/* Avatar */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-lg font-bold text-white shadow-sm">
        {profileData.avatar ? (
          <img
            src={profileData.avatar}
            alt={profileData.name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          profileData.name.charAt(0)
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-bold text-foreground">
          {profileData.name}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md bg-gradient-to-r px-1.5 py-0.5 text-[10px] font-bold text-white',
              getTierColor(profileData.tier)
            )}
          >
            <Award className="h-2.5 w-2.5" />
            {profileData.tier.toUpperCase()}
          </span>
          <span className="text-xs text-muted-foreground">Lihat Profil</span>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
    </Link>
  );
}

