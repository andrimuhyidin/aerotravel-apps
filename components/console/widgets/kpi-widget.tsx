/**
 * KPI Widget Components
 * Reusable KPI card widgets for dashboard
 * Part of Future Minimalist 2026 design system
 */

'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Calendar,
  DollarSign,
  Ship,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';

export type KPIWidgetProps = {
  title: string;
  value: number;
  format?: 'number' | 'currency' | 'percent';
  trend?: number;
  trendLabel?: string;
  icon: 'revenue' | 'bookings' | 'trips' | 'guides';
  delay?: number;
  loading?: boolean;
  className?: string;
};

const iconMap = {
  revenue: DollarSign,
  bookings: Calendar,
  trips: Ship,
  guides: Users,
};

const iconColors = {
  revenue: 'from-emerald-400 to-teal-500',
  bookings: 'from-blue-400 to-indigo-500',
  trips: 'from-purple-400 to-violet-500',
  guides: 'from-orange-400 to-amber-500',
};

export function KPIWidget({
  title,
  value,
  format = 'number',
  trend,
  trendLabel,
  icon,
  delay = 0,
  loading = false,
  className,
}: KPIWidgetProps) {
  const prefersReducedMotion = useReducedMotion();
  const Icon = iconMap[icon];
  const gradientClass = iconColors[icon];

  if (loading) {
    return (
      <GlassCard className={cn('h-full', className)} hover={false}>
        <GlassCardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          </div>
        </GlassCardContent>
      </GlassCard>
    );
  }

  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 ? 'text-emerald-600' : trend && trend < 0 ? 'text-red-600' : 'text-muted-foreground';

  const content = (
    <GlassCard className={cn('h-full', className)}>
      <GlassCardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className={cn(
            'rounded-xl p-2.5 bg-gradient-to-br',
            gradientClass
          )}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend !== undefined && (
            <div className={cn('flex items-center gap-1 text-sm font-medium', trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <AnimatedNumber
            value={value}
            format={format}
            delay={delay + 200}
            className="text-2xl font-bold text-foreground"
          />
          <p className="text-sm text-muted-foreground">{title}</p>
          {trendLabel && (
            <p className="text-xs text-muted-foreground">{trendLabel}</p>
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

// Pre-configured KPI widgets
export function RevenueKPIWidget({
  value,
  trend,
  delay = 0,
  loading = false,
}: Omit<KPIWidgetProps, 'title' | 'icon' | 'format'>) {
  return (
    <KPIWidget
      title="Revenue Bulan Ini"
      value={value}
      format="currency"
      trend={trend}
      trendLabel="vs bulan lalu"
      icon="revenue"
      delay={delay}
      loading={loading}
    />
  );
}

export function BookingsKPIWidget({
  value,
  trend,
  delay = 0,
  loading = false,
}: Omit<KPIWidgetProps, 'title' | 'icon' | 'format'>) {
  return (
    <KPIWidget
      title="Total Booking"
      value={value}
      format="number"
      trend={trend}
      trendLabel="vs bulan lalu"
      icon="bookings"
      delay={delay}
      loading={loading}
    />
  );
}

export function TripsKPIWidget({
  value,
  trend,
  delay = 0,
  loading = false,
}: Omit<KPIWidgetProps, 'title' | 'icon' | 'format'>) {
  return (
    <KPIWidget
      title="Trip Aktif"
      value={value}
      format="number"
      trend={trend}
      icon="trips"
      delay={delay}
      loading={loading}
    />
  );
}

export function GuidesKPIWidget({
  value,
  trend,
  delay = 0,
  loading = false,
}: Omit<KPIWidgetProps, 'title' | 'icon' | 'format'>) {
  return (
    <KPIWidget
      title="Guide Aktif"
      value={value}
      format="number"
      trend={trend}
      icon="guides"
      delay={delay}
      loading={loading}
    />
  );
}

