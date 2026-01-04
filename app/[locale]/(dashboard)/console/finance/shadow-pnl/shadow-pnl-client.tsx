/**
 * Shadow P&L Client Component
 * Displays detailed P&L per trip with cost breakdown
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calculator,
  ChevronDown,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  formatCurrency,
  getProfitStatus,
  type TripPnL,
  type CostItem,
} from '@/lib/finance/shadow-pnl';
import queryKeys from '@/lib/queries/query-keys';

type PnLListResponse = {
  trips: TripPnL[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type PnLDetailResponse = {
  trip: {
    id: string;
    tripCode: string;
    startDate: string;
    endDate: string;
    status: string;
    packageName: string;
    destination: string;
    tripType: string;
  };
  pnl: TripPnL;
  scenarios: {
    current: {
      pax: number;
      revenue: number;
      cost: number;
      profit: number;
      margin: number;
    };
    breakeven: {
      pax: number;
      revenue: number;
      cost: number;
      profit: number;
      margin: number;
    };
    target30: number;
  };
  defaultCosts: Record<string, CostItem[]>;
};

async function fetchPnLList(page: number, status: string): Promise<PnLListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
  });
  if (status !== 'all') {
    params.append('status', status);
  }
  
  const response = await fetch(`/api/admin/finance/shadow-pnl?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch P&L list');
  }
  return response.json();
}

async function fetchPnLDetail(tripId: string): Promise<PnLDetailResponse> {
  const response = await fetch(`/api/admin/finance/shadow-pnl/${tripId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch P&L detail');
  }
  return response.json();
}

export function ShadowPnLClient() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: listData, isLoading: listLoading, refetch: refetchList } = useQuery({
    queryKey: queryKeys.admin.finance.shadowPnl(),
    queryFn: () => fetchPnLList(page, statusFilter),
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: queryKeys.admin.finance.shadowPnl(selectedTripId ?? undefined),
    queryFn: () => fetchPnLDetail(selectedTripId!),
    enabled: !!selectedTripId,
  });

  // Filter trips by search query
  const filteredTrips = listData?.trips.filter((trip) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      trip.tripCode.toLowerCase().includes(query) ||
      trip.packageName.toLowerCase().includes(query)
    );
  }) || [];

  if (selectedTripId && detailData) {
    return (
      <PnLDetailView
        data={detailData}
        onBack={() => setSelectedTripId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shadow P&L Report</h1>
          <p className="text-sm text-muted-foreground">
            Laba Rugi per Trip dengan Cost Breakdown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchList()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari trip code atau package..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trip List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Trip P&L</CardTitle>
          <CardDescription>
            {listData?.pagination.total || 0} trips ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data trip
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Pax</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => {
                  const status = getProfitStatus(trip.grossMargin);
                  return (
                    <TableRow
                      key={trip.tripId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedTripId(trip.tripId)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{trip.tripCode}</p>
                          <p className="text-xs text-muted-foreground">{trip.packageName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{format(new Date(trip.startDate), 'd MMM yyyy', { locale: idLocale })}</p>
                        <Badge variant="outline" className="text-[10px]">{trip.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{trip.totalPax}</TableCell>
                      <TableCell className="text-right">{formatCurrency(trip.netRevenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(trip.totalCost)}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          trip.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {formatCurrency(trip.grossProfit)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={status.color === 'green' ? 'default' : status.color === 'yellow' ? 'secondary' : 'destructive'}
                          className={cn(
                            status.color === 'green' && 'bg-green-500'
                          )}
                        >
                          {trip.grossMargin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {listData && listData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Halaman {page} dari {listData.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(listData.pagination.totalPages, p + 1))}
                  disabled={page === listData.pagination.totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PnLDetailView({
  data,
  onBack,
}: {
  data: PnLDetailResponse;
  onBack: () => void;
}) {
  const { trip, pnl, scenarios } = data;
  const [openCosts, setOpenCosts] = useState(true);
  const [openRevenue, setOpenRevenue] = useState(true);

  const status = getProfitStatus(pnl.grossMargin);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{trip.tripCode}</h1>
          <p className="text-sm text-muted-foreground">
            {trip.packageName} • {trip.destination}
          </p>
        </div>
        <Badge variant="outline">{trip.status}</Badge>
      </div>

      {/* Trip Info */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Tanggal</p>
              <p className="font-medium">
                {format(new Date(trip.startDate), 'd MMM yyyy', { locale: idLocale })} - {format(new Date(trip.endDate), 'd MMM yyyy', { locale: idLocale })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Tipe Trip</p>
              <p className="font-medium capitalize">{trip.tripType.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Pax</p>
              <p className="font-medium">{pnl.totalPax} orang</p>
            </div>
            <div>
              <p className="text-muted-foreground">Breakeven Pax</p>
              <p className="font-medium">{pnl.breakevenPax === Infinity ? '-' : `${pnl.breakevenPax} orang`}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* P&L Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(pnl.netRevenue)}</p>
            <p className="text-xs text-muted-foreground">
              Gross: {formatCurrency(pnl.grossRevenue)} - Diskon: {formatCurrency(pnl.totalDiscounts)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(pnl.totalCost)}</p>
            <p className="text-xs text-muted-foreground">
              Fixed: {formatCurrency(pnl.totalFixedCost)} + Variable: {formatCurrency(pnl.totalVariableCost)}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(
          'border-l-4',
          status.color === 'green' && 'border-l-green-500',
          status.color === 'yellow' && 'border-l-yellow-500',
          status.color === 'red' && 'border-l-red-500'
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Profit
              {pnl.grossProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              'text-2xl font-bold',
              pnl.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(pnl.grossProfit)}
            </p>
            <p className="text-xs text-muted-foreground">
              Margin: {pnl.grossMargin.toFixed(1)}% ({status.label})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per Pax Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Metrik Per Pax
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Revenue/Pax</p>
              <p className="text-lg font-bold">{formatCurrency(pnl.revenuePerPax)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Cost/Pax</p>
              <p className="text-lg font-bold">{formatCurrency(pnl.costPerPax)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Profit/Pax</p>
              <p className={cn(
                'text-lg font-bold',
                pnl.profitPerPax >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(pnl.profitPerPax)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Collapsible open={openRevenue} onOpenChange={setOpenRevenue}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <CardTitle>Revenue Breakdown</CardTitle>
                <ChevronDown className={cn(
                  'h-5 w-5 transition-transform',
                  openRevenue && 'rotate-180'
                )} />
              </div>
            </CollapsibleTrigger>
            <CardDescription>{pnl.revenueItems.length} bookings</CardDescription>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking Code</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Pax</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Diskon</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pnl.revenueItems.map((item) => (
                    <TableRow key={item.bookingId}>
                      <TableCell className="font-medium">{item.bookingCode}</TableCell>
                      <TableCell>{item.customerName || '-'}</TableCell>
                      <TableCell className="text-right">{item.paxCount}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.grossAmount)}</TableCell>
                      <TableCell className="text-right text-red-600">
                        {item.discountAmount > 0 ? `-${formatCurrency(item.discountAmount)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.netAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Cost Breakdown */}
      <Collapsible open={openCosts} onOpenChange={setOpenCosts}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <CardTitle>Cost Breakdown</CardTitle>
                <ChevronDown className={cn(
                  'h-5 w-5 transition-transform',
                  openCosts && 'rotate-180'
                )} />
              </div>
            </CollapsibleTrigger>
            <CardDescription>Fixed + Variable Costs</CardDescription>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Fixed Costs */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Badge variant="outline">Fixed</Badge>
                  Total: {formatCurrency(pnl.totalFixedCost)}
                </h4>
                <div className="space-y-2">
                  {pnl.fixedCosts.map((cost, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{cost.description}</p>
                        <p className="text-xs text-muted-foreground">{cost.category}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(cost.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Variable Costs */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Variable</Badge>
                  Total: {formatCurrency(pnl.totalVariableCost)} ({pnl.totalPax} pax)
                </h4>
                <div className="space-y-2">
                  {pnl.variableCosts.map((cost, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{cost.description}</p>
                        <p className="text-xs text-muted-foreground">{cost.category} • {formatCurrency(cost.amount)}/pax</p>
                      </div>
                      <p className="font-medium">{formatCurrency(cost.amount * pnl.totalPax)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Breakeven Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Analisis Breakeven</CardTitle>
          <CardDescription>Perbandingan skenario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm font-medium text-muted-foreground mb-2">Current</p>
              <p className="text-xl font-bold">{scenarios.current.pax} pax</p>
              <p className={cn(
                'text-sm',
                scenarios.current.profit >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(scenarios.current.profit)}
              </p>
              <p className="text-xs text-muted-foreground">
                Margin: {scenarios.current.margin.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20">
              <p className="text-sm font-medium text-muted-foreground mb-2">Breakeven</p>
              <p className="text-xl font-bold">{scenarios.breakeven.pax === Infinity ? '-' : `${scenarios.breakeven.pax} pax`}</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Titik impas
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
              <p className="text-sm font-medium text-muted-foreground mb-2">Target 30%</p>
              <p className="text-xl font-bold">{scenarios.target30 === Infinity ? '-' : `${scenarios.target30} pax`}</p>
              <p className="text-sm text-green-600">
                Margin 30%
              </p>
              <p className="text-xs text-muted-foreground">
                Target margin ideal
              </p>
            </div>
          </div>

          {/* Progress to Breakeven */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress ke Breakeven</span>
              <span className="text-sm text-muted-foreground">
                {pnl.isAboveBreakeven ? '✓ Above Breakeven' : `${pnl.totalPax}/${pnl.breakevenPax} pax`}
              </span>
            </div>
            <Progress
              value={pnl.breakevenPax === Infinity ? 0 : Math.min(100, (pnl.totalPax / pnl.breakevenPax) * 100)}
              className={cn(
                'h-3',
                pnl.isAboveBreakeven && '[&>div]:bg-green-500'
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

