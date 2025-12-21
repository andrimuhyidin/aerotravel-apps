/**
 * Promo & Updates Widget
 * Menampilkan promo, update, dan pengumuman dari perusahaan
 * Per screen: 1 card penuh + peek card berikutnya (untuk indicate ada content lebih)
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Megaphone, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type PromoUpdate = {
  id: string;
  type: 'promo' | 'update' | 'announcement';
  title: string;
  subtitle: string;
  description?: string;
  image?: string;
  link?: string;
  badge?: string;
  gradient: string;
  priority: 'high' | 'medium' | 'low';
  startDate?: string;
  endDate?: string;
};

type PromoUpdatesWidgetProps = {
  locale: string;
};

export function PromoUpdatesWidget({ locale }: PromoUpdatesWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const promoRef = useRef<HTMLDivElement>(null);

  // Fetch promo/updates with limit=3 for widget display
  const { data: promosData, isLoading } = useQuery<{ items: PromoUpdate[] }>({
    queryKey: [...queryKeys.guide.all, 'promos', 'updates', 'widget'],
    queryFn: async () => {
      const res = await fetch('/api/guide/promos-updates?limit=3');
      if (!res.ok) return { items: [] };
      return await res.json();
    },
    staleTime: 300000, // 5 minutes
  });

  // Standardize to 3 items for widget display
  const promos = (promosData?.items || []).slice(0, 3);
  
  // Calculate max index untuk slide
  // Per screen: 1 card penuh + peek card berikutnya (~20% terlihat)
  // Jika ada 3 items: bisa slide 2x (index 0->1->2)
  // Jika ada 4 items: bisa slide 3x (index 0->1->2->3)
  // Formula: maxIndex = promos.length - 1
  const maxIndex = Math.max(0, promos.length - 1);
  const canSlide = promos.length > 1;

  // Auto-slide promo jika bisa slide
  useEffect(() => {
    if (!canSlide) {
      setCurrentIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        return next > maxIndex ? 0 : next;
      });
    }, 5000); // Change every 5 seconds

    return () => clearInterval(timer);
  }, [canSlide, maxIndex]);

  if (isLoading) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            PROMO & UPDATE
          </h2>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-[180px] rounded-lg" style={{ width: '85%' }} />
        </div>
      </div>
    );
  }

  // Show empty state if no promos
  if (promos.length === 0) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            PROMO & UPDATE
          </h2>
        </div>
        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="p-4 text-center">
            <Megaphone className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-600">
              Belum ada promo atau update. Update akan muncul di sini.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 1 card per slide with peek design
  // Card takes ~85% width, showing ~15% peek of next card
  // Gap between cards: 12px (gap-3)
  const cardWidthPercent = 85; // Card width in percentage
  const gapSize = 12; // 12px gap (gap-3 = 0.75rem = 12px)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          PROMO & UPDATE
        </h2>
        <div className="flex items-center gap-2">
          {canSlide && promos.length > 1 && (
            <div className="flex gap-1">
              {Array.from({ length: promos.length }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-200',
                    idx === currentIndex ? 'w-4 bg-emerald-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400',
                  )}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
          <Link
            href={`/${locale}/guide/promos`}
            className="text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700"
            aria-label="Lihat semua promo dan update"
          >
            Lihat Semua
          </Link>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          ref={promoRef}
          className="flex gap-3 transition-transform duration-300 ease-in-out"
          style={{ 
            transform: canSlide 
              ? `translateX(calc(-${currentIndex} * (${cardWidthPercent}% + ${gapSize}px)))`
              : 'translateX(0)',
          }}
        >
          {promos.map((promo, index) => {
            // Use unique key combining ID and index for extra safety
            const uniqueKey = `promo-${promo.id}-${index}`;
            
            const cardContent = (
              <Card
                className={cn(
                  'h-[180px] flex-shrink-0 overflow-hidden border-0 shadow-md rounded-lg',
                  `bg-gradient-to-br ${promo.gradient}`,
                  'transition-all hover:shadow-lg active:scale-[0.98]',
                  promo.link && 'cursor-pointer',
                )}
                style={{ width: `${cardWidthPercent}%` }}
              >
                <CardContent className="p-4 h-full flex flex-col text-white justify-between">
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    {promo.badge && (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold shadow-sm border border-white/10 w-fit">
                        {promo.type === 'promo' && <Sparkles className="h-3.5 w-3.5" />}
                        {promo.type === 'update' && <Megaphone className="h-3.5 w-3.5" />}
                        {promo.type === 'announcement' && <Megaphone className="h-3.5 w-3.5" />}
                        {promo.badge}
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-center gap-2">
                      <h3 className="text-base font-bold leading-snug line-clamp-2 text-white">
                        {promo.title}
                      </h3>
                      <p className="text-sm font-medium opacity-95 line-clamp-2 text-white/95 leading-relaxed">
                        {promo.subtitle}
                      </p>
                    </div>
                  </div>
                  {promo.link && (
                    <div className="flex justify-end pt-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/10 transition-all hover:bg-white/30">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );

            // Card click handler: if promo.link exists, use it; otherwise navigate to detail page
            const cardHref = promo.link || `/${locale}/guide/promos/${promo.id}`;
            
            return (
              <Link
                key={uniqueKey}
                href={cardHref}
                className="flex-shrink-0"
                style={{ width: `${cardWidthPercent}%` }}
                aria-label={promo.title}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
