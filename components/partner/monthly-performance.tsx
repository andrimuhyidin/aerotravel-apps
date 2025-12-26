/**
 * Monthly Performance - Performance metrics bulan ini
 * 4 KPI cards: Total Sales, Total Orders, Commission, Average Order Value
 */

'use client';

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  DollarSign,
  Wallet,
  BarChart3,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/partner/package-utils';
import { cn } from '@/lib/utils';

type MonthlyStats = {
  totalSales: number;
  totalOrders: number;
  commission: number;
  avgOrderValue: number;
  salesTrend: number;
  ordersTrend: number;
  commissionTrend: number;
  aovTrend: number;
};

type MonthlyPerformanceProps = {
  stats: MonthlyStats;
  loading?: boolean;
};

export function MonthlyPerformance({
  stats,
  loading = false,
}: MonthlyPerformanceProps) {
  if (loading) {
    return <MonthlyPerformanceSkeleton />;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard
        label="Total Sales"
        value={formatCurrency(stats.totalSales)}
        trend={stats.salesTrend}
        icon={DollarSign}
        color="blue"
      />
      <MetricCard
        label="Total Order"
        value={`${stats.totalOrders} booking`}
        trend={stats.ordersTrend}
        icon={Package}
        color="blue"
      />
      <MetricCard
        label="Komisi"
        value={formatCurrency(stats.commission)}
        trend={stats.commissionTrend}
        icon={Wallet}
        color="green"
      />
      <MetricCard
        label="Avg. Order"
        value={formatCurrency(stats.avgOrderValue)}
        trend={stats.aovTrend}
        icon={BarChart3}
        color="purple"
      />
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  trend: number;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'purple' | 'orange';
};

function MetricCard({
  label,
  value,
  trend,
  icon: Icon,
  color = 'blue',
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend > 0) return TrendingUp;
    if (trend < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getIconBgColor = () => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
    };
    return colors[color];
  };

  const TrendIcon = getTrendIcon();
  const trendColor = getTrendColor();

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className={cn('rounded-lg p-2', getIconBgColor())}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className={cn('flex items-center gap-0.5 text-xs font-medium', trendColor)}>
            <TrendIcon className="h-3 w-3" aria-hidden="true" />
            <span>{Math.abs(trend)}%</span>
          </div>
        </div>

        <div>
          <p className="mb-0.5 text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-xl font-bold leading-tight text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MonthlyPerformanceSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
  );
}

