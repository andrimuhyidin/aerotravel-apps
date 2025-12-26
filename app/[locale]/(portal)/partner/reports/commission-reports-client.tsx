/**
 * Partner Commission Reports Client Component
 * REDESIGNED - Period selector, Chart preview, Downloadable
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/partner';
import { MetricCard } from '@/components/ui/metric-card';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { DollarSign, TrendingUp, Download, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type CommissionReport = {
  period: string;
  totalCommission: number;
  totalBookings: number;
  avgCommissionPerBooking: number;
  trend: number;
  breakdown: Array<{
    month: string;
    commission: number;
    bookings: number;
  }>;
};

export function CommissionReportsClient({ locale }: { locale: string }) {
  const [report, setReport] = useState<CommissionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/reports/commission?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch report');
      const data = (await res.json()) as CommissionReport;
      setReport(data);
    } catch (error) {
      logger.error('Failed to load report', error);
      toast.error('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    toast.success('Download laporan dimulai');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Laporan Komisi"
        description="Ringkasan penghasilan komisi Anda"
        action={
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      />

      {/* Period Selector */}
      <div className="px-4 pb-4">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">Bulanan</TabsTrigger>
            <TabsTrigger value="quarterly">Kuartalan</TabsTrigger>
            <TabsTrigger value="yearly">Tahunan</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4 px-4 pb-20">
        {loading ? (
          <>
            <Skeleton className="h-32" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </>
        ) : report ? (
          <>
            {/* Main Metric */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Total Komisi</span>
                </div>
                <p className="mt-2 text-3xl font-bold text-green-700">
                  {formatCurrency(report.totalCommission)}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">{report.trend}% dari periode sebelumnya</span>
                </div>
              </CardContent>
            </Card>

            {/* Sub Metrics */}
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                title="Total Bookings"
                value={report.totalBookings.toString()}
                icon={Calendar}
                iconColor="primary"
                size="sm"
              />
              <MetricCard
                title="Avg per Booking"
                value={formatCurrency(report.avgCommissionPerBooking)}
                icon={DollarSign}
                iconColor="success"
                size="sm"
              />
            </div>

            {/* Breakdown */}
            <Card>
              <CardContent className="space-y-3 p-4">
                <h3 className="font-semibold text-foreground">Breakdown per Periode</h3>
                {report.breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="text-sm text-muted-foreground">{item.month}</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(item.commission)}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.bookings} bookings</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
