/**
 * Personalized Dashboard Component
 * Role-based dashboard with staggered animations
 * Part of Future Minimalist 2026 design system
 */

'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { getDashboardLayout } from '@/lib/config/dashboard-layouts';
import queryKeys from '@/lib/queries/query-keys';
import type { Database } from '@/types/supabase';

import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { PageTransition } from '@/components/motion/page-transition';
import { WidgetRenderer, WidgetGrid, type WidgetData } from './widget-renderer';
import { QuickLinksWidget, type QuickLink } from './widgets/quick-links-widget';

type UserRole = Database['public']['Enums']['user_role'];

// ==========================================
// TYPES
// ==========================================

export type PersonalizedDashboardProps = {
  userRole: UserRole | null;
  userName?: string;
  locale?: string;
};

type DashboardData = {
  revenue: number;
  revenueTrend: number;
  bookings: number;
  bookingsTrend: number;
  activeTrips: number;
  tripsTrend: number;
  activeGuides: number;
  guidesTrend: number;
  recentActivities: Array<{
    id: string;
    type: 'booking' | 'payment' | 'trip' | 'guide' | 'sos';
    title: string;
    description: string;
    timestamp: string;
    status?: 'success' | 'warning' | 'danger';
  }>;
  quickStats: Array<{
    id: string;
    label: string;
    value: string | number;
    href: string;
    icon: 'clock' | 'trending' | 'chart' | 'alert';
    color: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
  }>;
  upcomingTrips: Array<{
    id: string;
    tripCode: string;
    packageName: string;
    tripDate: string;
    paxCount: number;
    guideName: string | null;
    status: 'confirmed' | 'pending' | 'in_progress' | 'completed';
  }>;
  sosAlerts: number;
};

// ==========================================
// DATA FETCHING
// ==========================================

async function fetchDashboardData(): Promise<DashboardData> {
  // Fetch from multiple endpoints in parallel
  const [financeRes, trackingRes, auditLogRes, sosRes] = await Promise.allSettled([
    fetch('/api/admin/finance/dashboard?period=month'),
    fetch('/api/admin/guide/live-tracking'),
    fetch('/api/admin/audit-log?limit=10&page=1'),
    fetch('/api/admin/sos').catch(() => null),
  ]);

  // Parse finance data
  let financeData: Record<string, unknown> | null = null;
  if (financeRes.status === 'fulfilled' && financeRes.value.ok) {
    financeData = await financeRes.value.json();
  }

  // Parse live tracking data
  let trackingData: Record<string, unknown> | null = null;
  if (trackingRes.status === 'fulfilled' && trackingRes.value.ok) {
    trackingData = await trackingRes.value.json();
  }

  // Parse audit log for recent activities
  // API returns resourceType and resourceId (camelCase)
  let recentActivities: DashboardData['recentActivities'] = [];
  if (auditLogRes.status === 'fulfilled' && auditLogRes.value.ok) {
    const auditData = await auditLogRes.value.json();
    recentActivities = ((auditData.logs || []) as Array<{ 
      id: string; 
      action: string; 
      resourceType: string; 
      resourceId: string; 
      createdAt: string;
    }>).slice(0, 5).map((log) => {
      let type: 'booking' | 'payment' | 'trip' | 'guide' | 'sos' = 'booking';
      let title = `${log.action} ${log.resourceType}`;
      const description = log.resourceId || '';

      if (log.resourceType === 'booking') {
        type = 'booking';
        title = 'Booking baru diterima';
      } else if (log.resourceType === 'payment') {
        type = 'payment';
        title = 'Pembayaran dikonfirmasi';
      } else if (log.resourceType === 'trip') {
        type = 'trip';
        title = 'Trip updated';
      } else if (log.resourceType === 'guide') {
        type = 'guide';
        title = 'Guide activity';
      }

      return {
        id: log.id,
        type,
        title,
        description,
        timestamp: log.createdAt,
        status: log.action === 'create' ? 'success' as const : log.action === 'update' ? 'warning' as const : 'danger' as const,
      };
    });
  }

  // Get SOS alerts count
  let sosAlerts = 0;
  if (sosRes && sosRes.status === 'fulfilled' && sosRes.value?.ok) {
    try {
      const sosData = await sosRes.value.json();
      sosAlerts = ((sosData.alerts || []) as Array<{ status: string }>).filter((a) => a.status === 'active').length || 0;
    } catch {
      // Ignore error
    }
  }

  // Extract data safely
  const summary = financeData?.summary as { totalRevenue?: number; totalTrips?: number } | undefined;
  const guides = trackingData?.guides as unknown[] | undefined;
  const trips = financeData?.trips as Array<{ 
    tripId: string; 
    tripCode: string; 
    packageName: string; 
    startDate: string; 
    paxCount: number; 
    status: string;
  }> | undefined;

  return {
    revenue: summary?.totalRevenue || 0,
    revenueTrend: 12.5,
    bookings: summary?.totalTrips || 0,
    bookingsTrend: 5.2,
    activeTrips: guides?.length || 0,
    tripsTrend: 0,
    activeGuides: guides?.length || 0,
    guidesTrend: 0,
    recentActivities,
    quickStats: [
      { id: 'pending', label: 'Pending Approvals', value: 0, href: '/console/governance', icon: 'clock', color: 'yellow' },
      { id: 'revenue', label: 'Revenue MTD', value: formatCurrency(summary?.totalRevenue || 0), href: '/console/finance', icon: 'trending', color: 'green' },
      { id: 'bookings', label: 'Booking MTD', value: summary?.totalTrips || 0, href: '/console/bookings', icon: 'chart', color: 'blue' },
      { id: 'sos', label: 'SOS Alerts', value: sosAlerts, href: '/console/safety', icon: 'alert', color: sosAlerts > 0 ? 'red' : 'gray' },
    ],
    upcomingTrips: (trips || []).slice(0, 5).map((trip) => ({
      id: trip.tripId,
      tripCode: trip.tripCode,
      packageName: trip.packageName,
      tripDate: trip.startDate,
      paxCount: trip.paxCount,
      guideName: null,
      status: trip.status as 'confirmed' | 'pending' | 'in_progress' | 'completed',
    })),
    sosAlerts,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function PersonalizedDashboard({
  userRole,
  userName = 'Admin',
  locale = 'id',
}: PersonalizedDashboardProps) {
  const prefersReducedMotion = useReducedMotion();
  const layout = getDashboardLayout(userRole);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: [...queryKeys.admin.all, 'personalized-dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 60000, // Refresh every minute
  });

  React.useEffect(() => {
    if (error) {
      toast.error('Gagal memuat data dashboard');
    }
  }, [error]);

  // Map layout quick actions to QuickLink format
  const quickLinks: QuickLink[] = layout.quickActions.map((action) => ({
    id: action.id,
    title: action.label,
    description: '',
    href: action.href,
    icon: action.icon,
    variant: action.variant === 'primary' ? 'primary' : 'secondary',
  }));

  // Widget data
  const widgetData: WidgetData = {
    revenue: data?.revenue,
    revenueTrend: data?.revenueTrend,
    bookings: data?.bookings,
    bookingsTrend: data?.bookingsTrend,
    activeTrips: data?.activeTrips,
    tripsTrend: data?.tripsTrend,
    activeGuides: data?.activeGuides,
    guidesTrend: data?.guidesTrend,
    recentActivities: data?.recentActivities,
    quickStats: data?.quickStats,
    upcomingTrips: data?.upcomingTrips,
  };

  return (
    <PageTransition variant="slideUp">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <motion.h1
              className="text-2xl font-bold tracking-tight"
              initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {layout.greeting || `Halo, ${userName}`}
            </motion.h1>
            <motion.p
              className="text-muted-foreground"
              initial={prefersReducedMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Overview bisnis dan aktivitas terkini
            </motion.p>
          </div>
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="fm-rounded-button"
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')} />
              Refresh
            </Button>
          </motion.div>
        </div>

        {/* SOS Alert Banner */}
        {data?.sosAlerts && data.sosAlerts > 0 && (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard
              variant="elevated"
              className="border-red-500/50 bg-red-500/10"
              hover={false}
            >
              <GlassCardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-500/20 p-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-600">
                      {data.sosAlerts} SOS Alert Aktif
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Segera periksa kondisi darurat
                    </p>
                  </div>
                </div>
                <GradientButton variant="danger" size="sm" asChild>
                  <Link href={`/${locale}/console/safety`}>Lihat Detail</Link>
                </GradientButton>
              </GlassCardContent>
            </GlassCard>
          </motion.div>
        )}

        {/* Primary Widgets */}
        <WidgetGrid>
          {layout.primaryWidgets.map((widget, index) => (
            <WidgetRenderer
              key={widget.id}
              widgetId={widget.id}
              component={widget.component}
              size={widget.size}
              animationDelay={index * 100}
              data={widgetData}
              loading={isLoading}
              locale={locale}
            />
          ))}
        </WidgetGrid>

        {/* Secondary Widgets */}
        {layout.secondaryWidgets.length > 0 && (
          <WidgetGrid>
            {layout.secondaryWidgets.map((widget, index) => (
              <WidgetRenderer
                key={widget.id}
                widgetId={widget.id}
                component={widget.component}
                size={widget.size}
                animationDelay={(layout.primaryWidgets.length + index) * 100}
                data={widgetData}
                loading={isLoading}
                locale={locale}
              />
            ))}
          </WidgetGrid>
        )}

        {/* Quick Links */}
        {quickLinks.length > 0 && (
          <QuickLinksWidget
            links={quickLinks}
            delay={500}
          />
        )}
      </div>
    </PageTransition>
  );
}

