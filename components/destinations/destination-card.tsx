/**
 * Destination Card Component
 * Displays destination preview in listing pages
 */

import { MapPin } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import type { Destination } from '@/lib/destinations/data';

type DestinationCardProps = {
  destination: Destination;
  locale: string;
};

export function DestinationCard({ destination, locale }: DestinationCardProps) {
  return (
    <Link
      href={`/${locale}/destinations/${destination.slug}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-lg dark:bg-slate-800"
    >
      {/* Featured Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-blue-400/20 to-teal-500/20">
        <div className="flex h-full items-center justify-center text-6xl">
          🏝️
        </div>
        {/* Province Badge */}
        <div className="absolute left-3 top-3">
          <Badge variant="secondary" className="bg-white/95 backdrop-blur">
            <MapPin className="mr-1 h-3 w-3" />
            {destination.province}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="mb-2 text-xl font-bold text-foreground transition-colors group-hover:text-primary">
          {destination.name}
        </h3>

        {/* Description */}
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
          {destination.description}
        </p>

        {/* Highlights */}
        <div className="flex flex-wrap gap-1.5">
          {destination.highlights.slice(0, 3).map((highlight, index) => (
            <span
              key={index}
              className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {highlight}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

