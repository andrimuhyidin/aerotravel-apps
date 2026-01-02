/**
 * Mobile-Optimized Package Card Component
 * Compact package card with quick book action
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/partner/package-utils';
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type PackageCardMobileProps = {
  package: {
    id: string;
    name: string;
    slug: string;
    destination: string;
    duration_days: number;
    min_pax: number;
    max_pax: number;
    image_url?: string | null;
    price_nta?: number;
  };
  locale: string;
  onQuickBook?: () => void;
};

export function PackageCardMobile({
  package: pkg,
  locale,
  onQuickBook,
}: PackageCardMobileProps) {
  return (
    <Card className="overflow-hidden transition-all active:scale-[0.98]">
      <Link href={`/${locale}/partner/packages/${pkg.id}`}>
        <div className="relative h-48 w-full bg-muted">
          {pkg.image_url ? (
            <Image
              src={pkg.image_url}
              alt={pkg.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-foreground/40">
              <MapPin className="h-12 w-12" />
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <Link href={`/${locale}/partner/packages/${pkg.id}`}>
              <h3 className="font-semibold text-base mb-1 line-clamp-2">
                {pkg.name}
              </h3>
            </Link>
            <div className="flex items-center gap-2 text-xs text-foreground/70">
              <MapPin className="h-3 w-3" />
              <span>{pkg.destination}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-foreground/70">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{pkg.duration_days} hari</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>
                {pkg.min_pax}-{pkg.max_pax} pax
              </span>
            </div>
          </div>

          {pkg.price_nta && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <p className="text-xs text-foreground/70">Harga NTA</p>
                <p className="font-semibold text-primary">
                  {formatCurrency(pkg.price_nta)}/pax
                </p>
              </div>
              {onQuickBook ? (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onQuickBook();
                  }}
                  className="gap-2"
                >
                  Quick Book
                  <ArrowRight className="h-3 w-3" />
                </Button>
              ) : (
                <Link href={`/${locale}/partner/bookings/new?packageId=${pkg.id}`}>
                  <Button size="sm" className="gap-2">
                    Book Now
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

