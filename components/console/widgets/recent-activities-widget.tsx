/**
 * Recent Activities Widget
 * Shows latest system activities with icons and timestamps
 * Part of Future Minimalist 2026 design system
 */

'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Calendar,
  Wallet,
  Ship,
  Users,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
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
import { GradientStatusBadge, type StatusType } from '@/components/ui/gradient-status-badge';

export type Activity = {
  id: string;
  type: 'booking' | 'payment' | 'trip' | 'guide' | 'sos';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'danger';
};

export type RecentActivitiesWidgetProps = {
  activities: Activity[];
  delay?: number;
  loading?: boolean;
  className?: string;
  locale?: string;
};

const iconMap = {
  booking: Calendar,
  payment: Wallet,
  trip: Ship,
  guide: Users,
  sos: AlertTriangle,
};

const statusMap: Record<string, StatusType> = {
  success: 'success',
  warning: 'warning',
  danger: 'error',
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  return `${days} hari lalu`;
}

export function RecentActivitiesWidget({
  activities,
  delay = 0,
  loading = false,
  className,
  locale = 'id',
}: RecentActivitiesWidgetProps) {
  const prefersReducedMotion = useReducedMotion();

  if (loading) {
    return (
      <GlassCard className={cn('h-full', className)} hover={false}>
        <GlassCardHeader>
          <div className="h-6 w-40 rounded bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </GlassCardContent>
      </GlassCard>
    );
  }

  const content = (
    <GlassCard className={cn('h-full', className)}>
      <GlassCardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <GlassCardTitle>Aktivitas Terkini</GlassCardTitle>
          <GlassCardDescription>Update real-time dari sistem</GlassCardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/console/audit-log`}>
            Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              Belum ada aktivitas
            </p>
          ) : (
            activities.map((activity, index) => {
              const Icon = iconMap[activity.type];
              const AnimatedItem = prefersReducedMotion ? 'div' : motion.div;

              return (
                <AnimatedItem
                  key={activity.id}
                  className="flex items-start gap-4 rounded-xl border p-4 hover:bg-muted/50 transition-colors"
                  {...(!prefersReducedMotion && {
                    initial: { opacity: 0, x: -10 },
                    animate: { opacity: 1, x: 0 },
                    transition: {
                      delay: (delay + index * 100) / 1000,
                      type: 'spring',
                      stiffness: 300,
                      damping: 24,
                    },
                  })}
                >
                  <div className="rounded-full bg-muted p-2.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{activity.title}</p>
                      {activity.status && (
                        <GradientStatusBadge
                          status={statusMap[activity.status]}
                          label={activity.status}
                          size="sm"
                        />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
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

