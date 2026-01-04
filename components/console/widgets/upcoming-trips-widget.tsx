/**
 * Upcoming Trips Widget
 * Shows next scheduled trips with details
 * Part of Future Minimalist 2026 design system
 */

'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Ship, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
} from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { StatusBadgeSubtle, type StatusType } from '@/components/ui/gradient-status-badge';

export type UpcomingTrip = {
  id: string;
  tripCode: string;
  packageName: string;
  tripDate: string;
  paxCount: number;
  guideName: string | null;
  status: 'confirmed' | 'pending' | 'in_progress' | 'completed';
};

export type UpcomingTripsWidgetProps = {
  trips: UpcomingTrip[];
  delay?: number;
  loading?: boolean;
  className?: string;
  locale?: string;
};

const statusMap: Record<string, { label: string; type: StatusType }> = {
  confirmed: { label: 'Confirmed', type: 'success' },
  pending: { label: 'Pending', type: 'pending' },
  in_progress: { label: 'In Progress', type: 'info' },
  completed: { label: 'Completed', type: 'default' },
};

export function UpcomingTripsWidget({
  trips,
  delay = 0,
  loading = false,
  className,
  locale = 'id',
}: UpcomingTripsWidgetProps) {
  const prefersReducedMotion = useReducedMotion();

  if (loading) {
    return (
      <GlassCard className={cn('h-full', className)} hover={false}>
        <GlassCardHeader>
          <div className="h-6 w-36 rounded bg-muted animate-pulse" />
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
        </GlassCardHeader>
        <GlassCardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 w-full rounded-xl bg-muted animate-pulse" />
          ))}
        </GlassCardContent>
      </GlassCard>
    );
  }

  const content = (
    <GlassCard className={cn('h-full', className)}>
      <GlassCardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <GlassCardTitle>Trip Mendatang</GlassCardTitle>
          <GlassCardDescription>5 trip terdekat yang akan berangkat</GlassCardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/console/operations/trips`}>
            Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="space-y-3">
          {trips.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              Tidak ada trip mendatang
            </p>
          ) : (
            trips.map((trip, index) => {
              const statusConfig = statusMap[trip.status] || statusMap.pending;
              const AnimatedItem = prefersReducedMotion ? 'div' : motion.div;

              return (
                <AnimatedItem
                  key={trip.id}
                  className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/50 transition-colors"
                  {...(!prefersReducedMotion && {
                    initial: { opacity: 0, y: 10 },
                    animate: { opacity: 1, y: 0 },
                    transition: {
                      delay: (delay + index * 80) / 1000,
                      type: 'spring',
                      stiffness: 300,
                      damping: 24,
                    },
                  })}
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 p-2.5">
                      <Ship className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{trip.tripCode}</p>
                      <p className="text-sm text-muted-foreground">{trip.packageName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <p className="font-medium">
                        {new Date(trip.tripDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-muted-foreground">{trip.paxCount} pax</p>
                    </div>
                    <StatusBadgeSubtle
                      status={statusConfig.type}
                      label={statusConfig.label}
                      size="sm"
                    />
                  </div>
                </AnimatedItem>
              );
            })
          )}
        </div>
      </GlassCardContent>
    </GlassCard>
  );

  if (prefersReducedMotion) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: delay / 1000,
        type: 'spring',
        stiffness: 300,
        damping: 24,
      }}
    >
      {content}
    </motion.div>
  );
}

