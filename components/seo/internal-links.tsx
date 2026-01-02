/**
 * Internal Links Component
 * Smart internal linking for SEO
 */

'use client';

import { ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import queryKeys from '@/lib/queries/query-keys';
import { logger } from '@/lib/utils/logger';

type InternalLinksProps = {
  currentPage: string;
  type?: 'related' | 'popular' | 'recent';
  category?: string;
  limit?: number;
  locale: string;
};

type LinkItem = {
  title: string;
  href: string;
  description?: string;
  type: 'package' | 'destination' | 'article';
};

export function InternalLinks({
  currentPage,
  type = 'related',
  category,
  limit = 4,
  locale,
}: InternalLinksProps) {
  const { data: links, isLoading } = useQuery<LinkItem[]>({
    queryKey: queryKeys.seo.internalLinks(currentPage, type, category),
    queryFn: async () => {
      // Fetch related content based on current page
      const params = new URLSearchParams({
        currentPage,
        type,
        limit: String(limit),
        ...(category && { category }),
      });

      const res = await fetch(`/api/seo/internal-links?${params}`);
      if (!res.ok) {
        logger.warn('Failed to fetch internal links');
        return [];
      }
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  if (!links || links.length === 0) {
    return null;
  }

  const getIcon = (type: 'package' | 'destination' | 'article') => {
    switch (type) {
      case 'package':
        return '📦';
      case 'destination':
        return '🏝️';
      case 'article':
        return '📝';
    }
  };

  const getTypeLabel = (type: 'package' | 'destination' | 'article') => {
    switch (type) {
      case 'package':
        return 'Paket';
      case 'destination':
        return 'Destinasi';
      case 'article':
        return 'Artikel';
    }
  };

  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
        <TrendingUp className="h-5 w-5 text-primary" />
        {type === 'related' && 'Konten Terkait'}
        {type === 'popular' && 'Paling Populer'}
        {type === 'recent' && 'Terbaru'}
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className="group block rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-slate-800"
          >
            <div className="mb-2 flex items-start justify-between">
              <span className="text-2xl">{getIcon(link.type)}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {getTypeLabel(link.type)}
              </span>
            </div>
            <h4 className="mb-1 line-clamp-2 font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
              {link.title}
            </h4>
            {link.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {link.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-primary">
              Lihat Detail
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

