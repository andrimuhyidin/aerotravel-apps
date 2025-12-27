/**
 * Floating Action Button - Quick Booking
 * Primary action untuk create booking dari anywhere
 * Shopee Seller / Tokopedia Seller pattern
 */

'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FloatingActionButton() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  // Only show FAB on bookings list page
  const showPaths = [`/${locale}/partner/bookings`];

  const shouldShow = showPaths.some((path) => pathname === path);

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-20 z-40" style={{ right: 'max(1rem, calc((100vw - 28rem) / 2 + 1rem))' }}>
      <Link href={`/${locale}/partner/bookings/new`}>
        <div
          className={cn(
            'h-16 w-16 rounded-full transition-all active:scale-95 cursor-pointer',
            'shadow-[0_16px_48px_rgba(0,0,0,0.4),0_8px_24px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)]',
            'hover:shadow-[0_20px_60px_rgba(0,0,0,0.45),0_12px_32px_rgba(0,0,0,0.35),0_6px_16px_rgba(0,0,0,0.25)]',
            'hover:scale-105 hover:-translate-y-2 duration-300',
            'bg-gradient-to-br from-primary to-blue-600',
            'hover:from-primary hover:to-blue-700',
            'flex items-center justify-center'
          )}
          role="button"
          aria-label="Buat booking baru"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-plus"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </div>
      </Link>
    </div>
  );
}
