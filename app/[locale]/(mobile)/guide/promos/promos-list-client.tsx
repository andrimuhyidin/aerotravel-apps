/**
 * Promos & Updates List Client Component
 * Display all promos, updates, and announcements with filters and sorting
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronRight, Megaphone, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type PromoUpdate = {
  id: string;
  type: 'promo' | 'update' | 'announcement';
  title: string;
  subtitle?: string;
  description?: string;
  link?: string;
  badge?: string;
  gradient?: string;
  priority: 'high' | 'medium' | 'low';
  startDate: string;
  endDate?: string;
};

type PromosListClientProps = {
  locale: string;
};

type FilterType = 'all' | 'promo' | 'update' | 'announcement';

export function PromosListClient({ locale }: PromosListClientProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Fetch all promos (no limit for list page)
  const { data: promosData, isLoading } = useQuery<{ items: PromoUpdate[] }>({
    queryKey: ['guide', 'promos', 'updates', 'list'],
    queryFn: async () => {
      const res = await fetch('/api/guide/promos-updates');
      if (!res.ok) return { items: [] };
      return await res.json();
    },
    staleTime: 300000, // 5 minutes
  });

  const allPromos = promosData?.items || [];

  // Filter by type
  const filteredPromos =
    filterType === 'all'
      ? allPromos
      : allPromos.filter((promo) => promo.type === filterType);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'promo':
        return Sparkles;
      case 'update':
      case 'announcement':
        return Megaphone;
      default:
        return Megaphone;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Card key={idx} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-3" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (allPromos.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Belum ada promo atau update"
        description="Promo, update, dan pengumuman akan muncul di sini setelah tersedia."
        variant="subtle"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(
          [
            { value: 'all' as FilterType, label: 'Semua' },
            { value: 'promo' as FilterType, label: 'Promo' },
            { value: 'update' as FilterType, label: 'Update' },
            { value: 'announcement' as FilterType, label: 'Pengumuman' },
          ] as const
        ).map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterType(filter.value)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              filterType === filter.value
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Promos List */}
      {filteredPromos.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={`Tidak ada ${filterType === 'all' ? 'promo atau update' : filterType}`}
          description="Coba filter lain untuk melihat konten yang tersedia."
          variant="subtle"
        />
      ) : (
        <div className="space-y-3">
          {filteredPromos.map((promo) => {
            const TypeIcon = getTypeIcon(promo.type);
            const cardHref = promo.link || `/${locale}/guide/promos/${promo.id}`;
            const gradientClass = promo.gradient || 'from-slate-500 to-slate-600';

            return (
              <Link
                key={promo.id}
                href={cardHref}
                className="block"
                aria-label={promo.title}
              >
                <Card
                  className={cn(
                    'border-0 shadow-sm overflow-hidden transition-all hover:shadow-md active:scale-[0.98]',
                    `bg-gradient-to-br ${gradientClass}`,
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {promo.badge && (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold shadow-sm border border-white/10">
                              <TypeIcon className="h-3.5 w-3.5" />
                              {promo.badge}
                            </div>
                          )}
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                              getPriorityColor(promo.priority),
                            )}
                          >
                            {promo.priority === 'high' && 'Penting'}
                            {promo.priority === 'medium' && 'Sedang'}
                            {promo.priority === 'low' && 'Info'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold leading-tight text-white mb-1">
                          {promo.title}
                        </h3>
                        {promo.subtitle && (
                          <p className="text-sm font-medium text-white/90 line-clamp-2">
                            {promo.subtitle}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-white/80 flex-shrink-0 mt-1" />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/80">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(promo.startDate)}</span>
                      </div>
                      {promo.endDate && (
                        <>
                          <span>-</span>
                          <span>{formatDate(promo.endDate)}</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

