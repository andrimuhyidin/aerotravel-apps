/**
 * Live Region Component
 * Announces dynamic content changes to screen readers
 */

'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

type LiveRegionProps = {
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
  id?: string;
};

export function LiveRegion({ 
  message, 
  priority = 'polite',
  className,
  id = 'live-region'
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && regionRef.current) {
      // Clear previous message to ensure announcement
      regionRef.current.textContent = '';
      // Force reflow
      void regionRef.current.offsetWidth;
      // Set new message
      regionRef.current.textContent = message;
    }
  }, [message]);

  return (
    <div
      ref={regionRef}
      id={id}
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className={cn('sr-only', className)}
    />
  );
}

