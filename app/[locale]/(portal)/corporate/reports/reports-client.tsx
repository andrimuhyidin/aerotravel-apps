/**
 * Corporate Reports Client Component
 * Enhanced with real API data and Recharts visualizations
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Download,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';

type DepartmentData = {
  department: string;
  bookings: number;
  spending: number;
  budget: number;
};

type MonthlyData = {
  month: string;
  spending: number;
  bookings: number;
};

type TopTraveler = {
  name: string;
  department: string;
  trips: number;
  spending: number;
};

type ReportsResponse = {
  summary: {
    totalSpending: number;
    totalBudget: number;
    totalBookings: number;
    remainingBudget: number;
    usagePercentage: number;
    spendingChange: number;
    bookingsChange: number;
  };
  departmentData: DepartmentData[];
  monthlyData: MonthlyData[];
  topTravelers: TopTraveler[];
  period: string;
  dateRange: {
    from: string;
    to: string;
  };
};

type ReportsClientProps = {
  locale: string;
};

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#65a30d', '#0891b2'];

export function ReportsClient({ locale }: ReportsClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');

  const { data, isLoading, isFetching, error, refetch } = useQuery<ReportsResponse>({
    queryKey: queryKeys.corporate.reports.department(undefined, selectedPeriod),
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/partner/corporate/reports?period=${selectedPeriod}`
      );
      return response.data as ReportsResponse;
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000000) {
      return `Rp ${(value / 1000000000).toFixed(1)}M`;
    }
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}Jt`;
    }
    if (value >= 1000) {
      return `Rp ${(value / 1000).toFixed(0)}K`;
    }
    return `Rp ${value}`;
  };

  const handleExport = () => {
    window.open(
      `/api/partner/corporate/reports/export?period=${selectedPeriod}&format=csv`,
      '_blank'
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-xl font-bold">Laporan</h1>
          <p className="text-sm text-muted-foreground">
            Analisis penggunaan budget travel
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-3" />
            <p className="font-medium mb-1 text-red-600">Gagal memuat laporan</p>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Terjadi kesalahan'}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Laporan</h1>
          <p className="text-sm text-muted-foreground">
            Analisis penggunaan budget travel
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { value: 'this_month', label: 'Bulan Ini' },
          { value: 'last_month', label: 'Bulan Lalu' },
          { value: 'this_quarter', label: 'Kuartal Ini' },
          { value: 'this_year', label: 'Tahun Ini' },
        ].map((period) => (
          <Button
            key={period.value}
            variant={selectedPeriod === period.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period.value)}
          >
            {period.label}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Spending</p>
              <p className="text-lg font-bold">
                {formatCurrencyShort(data?.summary.totalSpending || 0)}
              </p>
              {data?.summary.spendingChange !== undefined && (
                <div
                  className={`flex items-center gap-1 text-xs mt-1 ${
                    data.summary.spendingChange <= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {data.summary.spendingChange <= 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  {Math.abs(data.summary.spendingChange)}% vs sebelumnya
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Booking</p>
              <p className="text-lg font-bold">{data?.summary.totalBookings || 0}</p>
              {data?.summary.bookingsChange !== undefined && (
                <div
                  className={`flex items-center gap-1 text-xs mt-1 ${
                    data.summary.bookingsChange >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {data.summary.bookingsChange >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(data.summary.bookingsChange)}% vs sebelumnya
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Sisa Budget</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrencyShort(data?.summary.remainingBudget || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {100 - (data?.summary.usagePercentage || 0)}% tersisa
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Trend Bulanan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrencyShort(value)}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Spending']}
                  labelFormatter={(label) => `Bulan: ${label}`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="spending"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Department Spending Pie Chart */}
      {data?.departmentData && data.departmentData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Spending per Departemen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="spending"
                    nameKey="department"
                    label={({ department, percent }) =>
                      `${department} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {data.departmentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Department List */}
            <div className="space-y-3 mt-4">
              {data.departmentData.map((dept, index) => {
                const percentage =
                  dept.budget > 0 ? (dept.spending / dept.budget) * 100 : 0;
                const isOverBudget = percentage > 90;

                return (
                  <div key={dept.department}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">
                          {dept.department}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({dept.bookings} booking)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">
                          {formatCurrencyShort(dept.spending)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {' / '}
                          {formatCurrencyShort(dept.budget)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverBudget ? 'bg-red-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Bar Chart */}
      {data?.departmentData && data.departmentData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Budget vs Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.departmentData}
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => formatCurrencyShort(value)}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="department"
                    tick={{ fontSize: 11 }}
                    width={70}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="budget" fill="#94a3b8" name="Budget" />
                  <Bar dataKey="spending" fill="#2563eb" name="Spending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Travelers */}
      {data?.topTravelers && data.topTravelers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Travelers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topTravelers.map((traveler, idx) => (
                <div
                  key={`${traveler.name}-${idx}`}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{traveler.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {traveler.department} • {traveler.trips} trips
                      </p>
                    </div>
                  </div>
                  <p className="font-medium text-sm">
                    {formatCurrency(traveler.spending)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {(!data?.departmentData || data.departmentData.length === 0) &&
        !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-medium mb-1">Belum ada data</p>
              <p className="text-sm text-muted-foreground">
                Data laporan akan muncul setelah ada booking
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
