/**
 * Widget Renderer Component
 * Dynamic widget loading with error boundaries
 * Part of Future Minimalist 2026 design system
 */

'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { getWidgetGridClass, type WidgetSize } from '@/lib/config/dashboard-layouts';

// Import widget components
import {
  RevenueKPIWidget,
  BookingsKPIWidget,
  TripsKPIWidget,
  GuidesKPIWidget,
} from './widgets/kpi-widget';
import { RecentActivitiesWidget, type Activity } from './widgets/recent-activities-widget';
import { QuickStatsWidget, type QuickStat } from './widgets/quick-stats-widget';
import { UpcomingTripsWidget, type UpcomingTrip } from './widgets/upcoming-trips-widget';

// ==========================================
// TYPES
// ==========================================

export type WidgetData = {
  // KPI data
  revenue?: number;
  revenueTrend?: number;
  bookings?: number;
  bookingsTrend?: number;
  activeTrips?: number;
  tripsTrend?: number;
  activeGuides?: number;
  guidesTrend?: number;
  
  // Activity data
  recentActivities?: Activity[];
  
  // Stats data
  quickStats?: QuickStat[];
  
  // Trips data
  upcomingTrips?: UpcomingTrip[];
};

export type WidgetRendererProps = {
  widgetId: string;
  component: string;
  size: WidgetSize;
  animationDelay?: number;
  data?: WidgetData;
  loading?: boolean;
  className?: string;
  locale?: string;
};

// ==========================================
// ERROR BOUNDARY
// ==========================================

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class WidgetErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <GlassCard className="h-full" hover={false}>
          <GlassCardContent className="flex flex-col items-center justify-center h-full min-h-[120px] text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="text-sm">Widget error</p>
          </GlassCardContent>
        </GlassCard>
      );
    }

    return this.props.children;
  }
}

// ==========================================
// WIDGET SKELETON
// ==========================================

function WidgetSkeleton({ size }: { size: WidgetSize }) {
  const heightClass = size === 'sm' ? 'min-h-[140px]' : size === 'md' ? 'min-h-[200px]' : 'min-h-[280px]';
  
  return (
    <GlassCard className={cn('h-full', heightClass)} hover={false}>
      <GlassCardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}

// ==========================================
// WIDGET RENDERER
// ==========================================

export function WidgetRenderer({
  widgetId,
  component,
  size,
  animationDelay = 0,
  data,
  loading = false,
  className,
  locale = 'id',
}: WidgetRendererProps) {
  const prefersReducedMotion = useReducedMotion();
  const gridClass = getWidgetGridClass(size);

  if (loading) {
    return (
      <div className={cn(gridClass, className)}>
        <WidgetSkeleton size={size} />
      </div>
    );
  }

  // Render the appropriate widget based on component name
  const renderWidget = () => {
    switch (component) {
      // KPI Widgets
      case 'RevenueKPIWidget':
        return (
          <RevenueKPIWidget
            value={data?.revenue || 0}
            trend={data?.revenueTrend}
            delay={animationDelay}
            loading={loading}
          />
        );
      
      case 'BookingsKPIWidget':
        return (
          <BookingsKPIWidget
            value={data?.bookings || 0}
            trend={data?.bookingsTrend}
            delay={animationDelay}
            loading={loading}
          />
        );
      
      case 'TripsKPIWidget':
        return (
          <TripsKPIWidget
            value={data?.activeTrips || 0}
            trend={data?.tripsTrend}
            delay={animationDelay}
            loading={loading}
          />
        );
      
      case 'GuidesKPIWidget':
        return (
          <GuidesKPIWidget
            value={data?.activeGuides || 0}
            trend={data?.guidesTrend}
            delay={animationDelay}
            loading={loading}
          />
        );

      // Activity Widgets
      case 'RecentActivitiesWidget':
        return (
          <RecentActivitiesWidget
            activities={data?.recentActivities || []}
            delay={animationDelay}
            loading={loading}
            locale={locale}
          />
        );

      // Stats Widgets
      case 'QuickStatsWidget':
        return (
          <QuickStatsWidget
            stats={data?.quickStats || []}
            delay={animationDelay}
            loading={loading}
          />
        );

      // Trips Widgets
      case 'UpcomingTripsWidget':
        return (
          <UpcomingTripsWidget
            trips={data?.upcomingTrips || []}
            delay={animationDelay}
            loading={loading}
            locale={locale}
          />
        );

      // Default placeholder for unimplemented widgets
      default:
        return (
          <GlassCard className="h-full">
            <GlassCardContent className="flex items-center justify-center h-full min-h-[120px]">
              <p className="text-sm text-muted-foreground">
                Widget: {component}
              </p>
            </GlassCardContent>
          </GlassCard>
        );
    }
  };

  const widget = (
    <WidgetErrorBoundary>
      {renderWidget()}
    </WidgetErrorBoundary>
  );

  if (prefersReducedMotion) {
    return (
      <div className={cn(gridClass, className)}>
        {widget}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(gridClass, className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: animationDelay / 1000,
        type: 'spring',
        stiffness: 300,
        damping: 24,
      }}
    >
      {widget}
    </motion.div>
  );
}

// ==========================================
// WIDGET GRID
// ==========================================

export type WidgetGridProps = {
  children: React.ReactNode;
  className?: string;
};

export function WidgetGrid({ children, className }: WidgetGridProps) {
  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6',
      className
    )}>
      {children}
    </div>
  );
}

