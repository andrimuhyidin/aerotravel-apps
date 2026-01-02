/**
 * Payroll Client Component
 * Displays guide payroll with trip assignments
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  RefreshCw,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/finance/shadow-pnl';
import queryKeys from '@/lib/queries/query-keys';

type GuidePayrollItem = {
  guideId: string;
  guideName: string;
  tripCount: number;
  totalPax: number;
  baseFee: number;
  bonuses: number;
  deductions: number;
  netPay: number;
  trips: Array<{
    tripId: string;
    tripCode: string;
    packageName: string;
    startDate: string;
    paxCount: number;
    fee: number;
    bonus: number;
  }>;
};

type PayrollResponse = {
  payroll: GuidePayrollItem[];
  summary: {
    totalGuides: number;
    totalTrips: number;
    totalPax: number;
    totalPayroll: number;
    totalBaseFee: number;
    totalBonuses: number;
    totalDeductions: number;
  };
  dateRange: {
    from: string;
    to: string;
  };
};

async function fetchPayrollData(period: string): Promise<PayrollResponse> {
  const response = await fetch(`/api/admin/finance/payroll?period=${period}`);
  if (!response.ok) {
    throw new Error('Failed to fetch payroll data');
  }
  return response.json();
}

export function PayrollClient() {
  const [period, setPeriod] = useState('month');
  const [expandedGuides, setExpandedGuides] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: [...queryKeys.admin.all, 'payroll', period],
    queryFn: () => fetchPayrollData(period),
  });

  useEffect(() => {
    if (error) {
      toast.error('Gagal memuat data payroll');
    }
  }, [error]);

  const toggleGuide = (guideId: string) => {
    const newExpanded = new Set(expandedGuides);
    if (newExpanded.has(guideId)) {
      newExpanded.delete(guideId);
    } else {
      newExpanded.add(guideId);
    }
    setExpandedGuides(newExpanded);
  };

  if (isLoading) {
    return <PayrollSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">Tidak ada data payroll</p>
        <Button onClick={() => refetch()}>Coba Lagi</Button>
      </div>
    );
  }

  const { payroll, summary, dateRange } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll Guide</h1>
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
              <SelectItem value="week">Minggu Ini</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guides</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalGuides}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalTrips} trips total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalPayroll)}</div>
            <p className="text-xs text-muted-foreground">
              Base: {formatCurrency(summary.totalBaseFee)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bonuses</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalBonuses)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalPax} pax handled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deductions</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalDeductions)}</div>
            <p className="text-xs text-muted-foreground">
              Penalties & deductions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll List */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Payroll per Guide</CardTitle>
          <CardDescription>
            Klik untuk melihat detail trip assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payroll.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data payroll untuk periode ini
            </div>
          ) : (
            <div className="space-y-2">
              {payroll.map((guide) => (
                <Collapsible
                  key={guide.guideId}
                  open={expandedGuides.has(guide.guideId)}
                  onOpenChange={() => toggleGuide(guide.guideId)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{guide.guideName}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{guide.tripCount} trips</span>
                              <span>•</span>
                              <span>{guide.totalPax} pax</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(guide.netPay)}</p>
                            <div className="flex items-center gap-2 text-xs">
                              {guide.bonuses > 0 && (
                                <Badge variant="default" className="bg-green-500 text-[10px]">
                                  +{formatCurrency(guide.bonuses)}
                                </Badge>
                              )}
                              {guide.deductions > 0 && (
                                <Badge variant="destructive" className="text-[10px]">
                                  -{formatCurrency(guide.deductions)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {expandedGuides.has(guide.guideId) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Trip</TableHead>
                              <TableHead>Tanggal</TableHead>
                              <TableHead className="text-right">Pax</TableHead>
                              <TableHead className="text-right">Fee</TableHead>
                              <TableHead className="text-right">Bonus</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {guide.trips.map((trip) => (
                              <TableRow key={trip.tripId}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{trip.tripCode}</p>
                                    <p className="text-xs text-muted-foreground">{trip.packageName}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {format(new Date(trip.startDate), 'd MMM yyyy', { locale: idLocale })}
                                </TableCell>
                                <TableCell className="text-right">{trip.paxCount}</TableCell>
                                <TableCell className="text-right">{formatCurrency(trip.fee)}</TableCell>
                                <TableCell className="text-right">
                                  {trip.bonus > 0 ? (
                                    <span className="text-green-600">+{formatCurrency(trip.bonus)}</span>
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50">
                              <TableCell colSpan={3} className="font-medium">Total</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(guide.baseFee)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-green-600">
                                {guide.bonuses > 0 ? `+${formatCurrency(guide.bonuses)}` : '-'}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PayrollSkeleton() {
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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

