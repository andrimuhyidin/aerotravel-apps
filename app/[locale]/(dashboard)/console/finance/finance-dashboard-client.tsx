/**
 * Finance Dashboard Client Component
 * Displays P&L summary, trends, and trip performance
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Calendar,
  DollarSign,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatCurrency, getProfitStatus, type TripPnL, type PnLSummary } from '@/lib/finance/shadow-pnl';
import queryKeys from '@/lib/queries/query-keys';

type MonthlyTrend = {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
  trips: number;
};

type DashboardData = {
  summary: PnLSummary;
  trips: TripPnL[];
  monthlyTrends: MonthlyTrend[];
  topTrips: TripPnL[];
  bottomTrips: TripPnL[];
  costBreakdown: Record<string, number>;
  dateRange: {
    from: string;
    to: string;
  };
};

async function fetchDashboardData(period: string): Promise<DashboardData> {
  const response = await fetch(`/api/admin/finance/dashboard?period=${period}`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return response.json();
}

export function FinanceDashboardClient() {
  const [period, setPeriod] = useState('month');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: [...queryKeys.admin.all, 'finance-dashboard', period],
    queryFn: () => fetchDashboardData(period),
  });

  useEffect(() => {
    if (error) {
      toast.error('Gagal memuat data finance dashboard');
    }
  }, [error]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">Tidak ada data</p>
        <Button onClick={() => refetch()}>Coba Lagi</Button>
      </div>
    );
  }

  const { summary, monthlyTrends, topTrips, bottomTrips, costBreakdown, dateRange } = data;
  const profitStatus = getProfitStatus(summary.averageMargin);

  // Calculate max values for chart scaling
  const maxRevenue = Math.max(...monthlyTrends.map((t) => t.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Periode: {dateRange.from} - {dateRange.to}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Bulan Ini</SelectItem>
              <SelectItem value="quarter">3 Bulan</SelectItem>
              <SelectItem value="year">Tahun Ini</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          icon={DollarSign}
          trend={summary.totalRevenue > 0 ? 'up' : 'neutral'}
        />
        <SummaryCard
          title="Total Profit"
          value={formatCurrency(summary.totalProfit)}
          icon={summary.totalProfit >= 0 ? TrendingUp : TrendingDown}
          trend={summary.totalProfit >= 0 ? 'up' : 'down'}
          description={`Margin: ${summary.averageMargin.toFixed(1)}%`}
        />
        <SummaryCard
          title="Total Trips"
          value={summary.totalTrips.toString()}
          icon={Calendar}
          trend="neutral"
          description={`${summary.profitableTrips} profitable`}
        />
        <SummaryCard
          title="Total Pax"
          value={summary.totalPax.toString()}
          icon={Users}
          trend="neutral"
        />
      </div>

      {/* Profit Status Banner */}
      <Card className={cn(
        'border-l-4',
        profitStatus.color === 'green' && 'border-l-green-500 bg-green-50 dark:bg-green-950/20',
        profitStatus.color === 'yellow' && 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
        profitStatus.color === 'red' && 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
      )}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Status Profitabilitas</p>
              <p className="text-2xl font-bold">{profitStatus.label}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Average Margin</p>
              <p className="text-2xl font-bold">{summary.averageMargin.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Trend Revenue & Profit
            </CardTitle>
            <CardDescription>6 bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyTrends.map((trend) => (
                <div key={trend.month} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{trend.month}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(trend.revenue)}
                    </span>
                  </div>
                  <div className="flex gap-1 h-6">
                    <div
                      className="bg-primary rounded-sm"
                      style={{ width: `${(trend.revenue / maxRevenue) * 70}%` }}
                      title={`Revenue: ${formatCurrency(trend.revenue)}`}
                    />
                    <div
                      className={cn(
                        'rounded-sm',
                        trend.profit >= 0 ? 'bg-green-500' : 'bg-red-500'
                      )}
                      style={{ width: `${Math.abs(trend.profit / maxRevenue) * 30}%` }}
                      title={`Profit: ${formatCurrency(trend.profit)}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{trend.trips} trips</span>
                    <span className={trend.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {trend.profit >= 0 ? '+' : ''}{formatCurrency(trend.profit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Distribusi biaya per kategori</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(costBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const totalCost = Object.values(costBreakdown).reduce((a, b) => a + b, 0);
                  const percentage = totalCost > 0 ? (amount / totalCost) * 100 : 0;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{category}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trip Performance Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Performing Trips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top Performing Trips
            </CardTitle>
            <CardDescription>Trips dengan margin tertinggi</CardDescription>
          </CardHeader>
          <CardContent>
            {topTrips.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Tidak ada trips profitable
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topTrips.map((trip) => (
                    <TableRow key={trip.tripId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{trip.tripCode}</p>
                          <p className="text-xs text-muted-foreground">
                            {trip.packageName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(trip.netRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default" className="bg-green-500">
                          {trip.grossMargin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Bottom Performing Trips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Trips Perlu Perhatian
            </CardTitle>
            <CardDescription>Trips dengan kerugian</CardDescription>
          </CardHeader>
          <CardContent>
            {bottomTrips.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Tidak ada trips merugi
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bottomTrips.map((trip) => (
                    <TableRow key={trip.tripId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{trip.tripCode}</p>
                          <p className="text-xs text-muted-foreground">
                            {trip.packageName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(trip.netRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">
                          {trip.grossMargin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: 'up' | 'down' | 'neutral';
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn(
          'h-4 w-4',
          trend === 'up' && 'text-green-500',
          trend === 'down' && 'text-red-500',
          trend === 'neutral' && 'text-muted-foreground'
        )} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

