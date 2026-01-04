/**
 * Contextual Links Component
 * Context-aware internal linking based on content
 */

'use client';

import Link from 'next/link';

type ContextualLinksProps = {
  keywords: string[];
  locale: string;
  className?: string;
};

type LinkMatch = {
  keyword: string;
  href: string;
  title: string;
};

// Predefined keyword to link mapping
const KEYWORD_LINKS: Record<string, { href: string; title: string }> = {
  pahawang: {
    href: '/destinations/pahawang',
    title: 'Pulau Pahawang',
  },
  kiluan: {
    href: '/destinations/kiluan',
    title: 'Teluk Kiluan',
  },
  'labuan bajo': {
    href: '/destinations/labuan-bajo',
    title: 'Labuan Bajo',
  },
  'raja ampat': {
    href: '/destinations/raja-ampat',
    title: 'Raja Ampat',
  },
  karimunjawa: {
    href: '/destinations/karimunjawa',
    title: 'Karimunjawa',
  },
  'tanjung lesung': {
    href: '/destinations/tanjung-lesung',
    title: 'Tanjung Lesung',
  },
  snorkeling: {
    href: '/blog?category=tips-perjalanan',
    title: 'Tips Snorkeling',
  },
  'island hopping': {
    href: '/blog?category=tips-perjalanan',
    title: 'Panduan Island Hopping',
  },
  booking: {
    href: '/book',
    title: 'Booking Paket Wisata',
  },
  'open trip': {
    href: '/packages?type=open_trip',
    title: 'Paket Open Trip',
  },
  'private trip': {
    href: '/packages?type=private',
    title: 'Paket Private Trip',
  },
};

export function ContextualLinks({
  keywords,
  locale,
  className = '',
}: ContextualLinksProps) {
  const matches: LinkMatch[] = [];

  // Find matching keywords
  keywords.forEach((keyword) => {
    const keywordLower = keyword.toLowerCase();
    const match = KEYWORD_LINKS[keywordLower];
    if (match) {
      matches.push({
        keyword,
        href: `/${locale}${match.href}`,
        title: match.title,
      });
    }
  });

  if (matches.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {matches.slice(0, 5).map((match, index) => (
        <Link
          key={index}
          href={match.href}
          className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition-all hover:bg-primary/20"
        >
          {match.title}
        </Link>
      ))}
    </div>
  );
}

