/**
 * Partner Analytics Client Component
 * REDESIGNED - MetricCards, Clean charts, KPI focus
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/partner';
import { MetricCard } from '@/components/ui/metric-card';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { DollarSign, TrendingUp, Calendar, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type AnalyticsData = {
  revenue: { value: number; trend: number };
  bookings: { value: number; trend: number };
  customers: { value: number; trend: number };
  avgOrderValue: { value: number; trend: number };
};

export function AnalyticsClient({ locale }: { locale: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/analytics?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const result = (await res.json()) as AnalyticsData;
      setData(result);
    } catch (error) {
      logger.error('Failed to load analytics', error);
      toast.error('Gagal memuat analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Analytics & Insights" description="Monitor performa bisnis Anda" />

      {/* Period Tabs */}
      <div className="px-4 pb-4">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="7d">7 Hari</TabsTrigger>
            <TabsTrigger value="30d">30 Hari</TabsTrigger>
            <TabsTrigger value="90d">90 Hari</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 px-4 pb-20 sm:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : data ? (
          <>
            <MetricCard
              title="Revenue"
              value={formatCurrency(data.revenue.value)}
              trend={data.revenue.trend}
              icon={DollarSign}
              iconColor="success"
            />
            <MetricCard
              title="Bookings"
              value={data.bookings.value.toString()}
              trend={data.bookings.trend}
              icon={Calendar}
              iconColor="primary"
            />
            <MetricCard
              title="Customers"
              value={data.customers.value.toString()}
              trend={data.customers.trend}
              icon={Users}
              iconColor="primary"
            />
            <MetricCard
              title="Avg Order Value"
              value={formatCurrency(data.avgOrderValue.value)}
              trend={data.avgOrderValue.trend}
              icon={TrendingUp}
              iconColor="success"
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
