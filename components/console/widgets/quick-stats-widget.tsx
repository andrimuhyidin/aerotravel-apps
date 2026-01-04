/**
 * Quick Stats Widget
 * Compact stats list with icons and links
 * Part of Future Minimalist 2026 design system
 */

'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Clock,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  type LucideIcon,
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

export type QuickStat = {
  id: string;
  label: string;
  value: string | number;
  href: string;
  icon: 'clock' | 'trending' | 'chart' | 'alert';
  color: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
};

export type QuickStatsWidgetProps = {
  stats: QuickStat[];
  delay?: number;
  loading?: boolean;
  className?: string;
};

const iconMap: Record<string, LucideIcon> = {
  clock: Clock,
  trending: TrendingUp,
  chart: BarChart3,
  alert: AlertTriangle,
};

const colorClasses: Record<string, string> = {
  green: 'text-emerald-600 dark:text-emerald-400',
  blue: 'text-blue-600 dark:text-blue-400',
  yellow: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
  gray: 'text-muted-foreground',
};

export function QuickStatsWidget({
  stats,
  delay = 0,
  loading = false,
  className,
}: QuickStatsWidgetProps) {
  const prefersReducedMotion = useReducedMotion();

  if (loading) {
    return (
      <GlassCard className={cn('h-full', className)} hover={false}>
        <GlassCardHeader>
          <div className="h-6 w-32 rounded bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </GlassCardHeader>
        <GlassCardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 w-full rounded-xl bg-muted animate-pulse" />
          ))}
        </GlassCardContent>
      </GlassCard>
    );
  }

  const content = (
    <GlassCard className={cn('h-full', className)}>
      <GlassCardHeader>
        <GlassCardTitle>Quick Stats</GlassCardTitle>
        <GlassCardDescription>Ringkasan cepat</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent className="space-y-3">
        {stats.map((stat, index) => {
          const Icon = iconMap[stat.icon];
          const AnimatedLink = prefersReducedMotion ? Link : motion(Link);

          return (
            <AnimatedLink
              key={stat.id}
              href={stat.href}
              className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/50 transition-colors"
              {...(!prefersReducedMotion && {
                initial: { opacity: 0, x: -10 },
                animate: { opacity: 1, x: 0 },
                transition: {
                  delay: (delay + index * 50) / 1000,
                  type: 'spring',
                  stiffness: 300,
                  damping: 24,
                },
              })}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn('h-4 w-4', colorClasses[stat.color])} />
                <span className="text-sm font-medium">{stat.label}</span>
              </div>
              <span className="font-semibold">{stat.value}</span>
            </AnimatedLink>
          );
        })}
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

