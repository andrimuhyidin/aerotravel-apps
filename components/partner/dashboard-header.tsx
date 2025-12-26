/**
 * Dashboard Header Component
 * Unified Profile + Search + Actions sticky header
 */

'use client';

import { Bell, MessageSquare, Search, Award } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

type DashboardHeaderProps = {
  profileData?: {
    name: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    avatar: string | null;
  };
  className?: string;
};

export function DashboardHeader({
  profileData = {
    name: 'Partner',
    tier: 'bronze',
    avatar: null,
  },
  className,
}: DashboardHeaderProps) {
  const params = useParams();
  const locale = params.locale as string;

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
    <div className={cn('sticky top-0 z-30 bg-card px-4 pt-4 pb-2 shadow-sm', className)}>
      {/* Top Row: Profile & Actions */}
      <div className="mb-3 flex items-center justify-between">
        {/* Profile Link */}
        <Link 
          href={`/${locale}/partner/account`}
          className="group flex items-center gap-3"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-sm font-bold text-white shadow-sm ring-2 ring-white group-active:scale-95 transition-transform">
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
          
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground line-clamp-1">
              {profileData.name}
            </span>
            <div className="flex items-center gap-1">
              <span className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-[1px] text-[9px] font-bold text-white shadow-sm",
                "bg-gradient-to-r", 
                getTierColor(profileData.tier)
              )}>
                <Award className="h-2 w-2" />
                {profileData.tier.toUpperCase()}
              </span>
            </div>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link href={`/${locale}/partner/inbox`}>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-primary active:bg-muted-foreground/20">
              <MessageSquare className="h-5 w-5" />
            </button>
          </Link>
          <Link href={`/${locale}/partner/notifications`}>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-primary active:bg-muted-foreground/20">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <Link href={`/${locale}/partner/packages`} className="block group">
        <div className="relative transition-transform group-active:scale-[0.99]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <div className="h-10 w-full rounded-xl bg-muted/50 pl-10 pr-4 text-sm text-muted-foreground flex items-center border border-transparent transition-colors group-hover:bg-muted/80 group-hover:border-primary/20">
            Cari paket wisata, booking...
          </div>
        </div>
      </Link>
    </div>
  );
}
