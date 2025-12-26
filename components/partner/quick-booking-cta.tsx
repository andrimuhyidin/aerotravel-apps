/**
 * Quick Booking CTA - Primary Action Button
 * Prominent CTA untuk partner create booking dengan cepat
 * Tiket.com B2B style: Large, accessible, prominent
 */

'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type QuickBookingCTAProps = {
  locale: string;
  className?: string;
};

export function QuickBookingCTA({ locale, className }: QuickBookingCTAProps) {
  return (
    <Link href={`/${locale}/partner/bookings/new`} className="block">
      <Button
        size="lg"
        className={cn(
          'h-14 w-full text-base font-semibold shadow-md transition-all',
          'active:scale-[0.98] active:shadow-sm',
          'focus:ring-2 focus:ring-primary focus:ring-offset-2',
          className
        )}
        aria-label="Buat booking baru"
      >
        <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
        Buat Booking Baru
      </Button>
    </Link>
  );
}

