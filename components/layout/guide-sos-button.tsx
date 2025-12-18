'use client';

/**
 * Guide SOS Button Component
 * Compact SOS button for header - navigates to SOS page
 */

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type GuideSOSButtonProps = {
  locale: string;
  className?: string;
};

export function GuideSOSButton({ locale, className }: GuideSOSButtonProps) {
  return (
    <Link href={`/${locale}/guide/sos`} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-9 w-9 rounded-full bg-red-500 text-white shadow-md transition-all hover:bg-red-600 hover:shadow-lg active:scale-95',
          className,
        )}
        aria-label="SOS Darurat"
        title="SOS Darurat - Buka halaman SOS"
      >
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </Button>
    </Link>
  );
}
