/**
 * Market Intelligence Client Component
 * Competitor price monitoring dashboard
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Eye,
  Globe,
  Minus,
  Plus,
  Search,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { PageHeader } from '@/components/partner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type CompetitorPrice = {
  id: string;
  competitorName: string;
  productName: string;
  currentPrice: number;
  previousPrice: number | null;
  priceChange: number;
  priceChangePercent: number;
  lastUpdated: string;
  ourPrice: number;
  priceDifference: number;
  priceDifferencePercent: number;
  trend: 'up' | 'down' | 'stable';
};

type MarketSummary = {
  totalTracked: number;
  averageMarketPrice: number;
  ourAveragePrice: number;
  pricePosition: 'below' | 'at' | 'above';
  competitiveIndex: number;
  alertsCount: number;
};

const addCompetitorSchema = z.object({
  competitorName: z.string().min(2, 'Nama kompetitor minimal 2 karakter'),
  productName: z.string().min(2, 'Nama produk minimal 2 karakter'),
  productUrl: z.string().url('URL tidak valid').optional().or(z.literal('')),
  currentPrice: z.number().positive('Harga harus positif'),
});

type AddCompetitorForm = z.infer<typeof addCompetitorSchema>;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTrendIcon(trend: CompetitorPrice['trend'], size = 4) {
  switch (trend) {
    case 'up':
      return <ArrowUp className={`h-${size} w-${size} text-red-500`} />;
    case 'down':
      return <ArrowDown className={`h-${size} w-${size} text-green-500`} />;
    default:
      return <Minus className={`h-${size} w-${size} text-muted-foreground`} />;
  }
}

type MarketIntelClientProps = {
  locale: string;
};

export function MarketIntelClient({ locale: _locale }: MarketIntelClientProps) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const form = useForm<AddCompetitorForm>({
    resolver: zodResolver(addCompetitorSchema),
    defaultValues: {
      competitorName: '',
      productName: '',
      productUrl: '',
      currentPrice: 0,
    },
  });

  // Fetch market summary
  const { data: summary, isLoading: summaryLoading } = useQuery<MarketSummary>({
    queryKey: queryKeys.partner.marketIntel.summary(),
    queryFn: async (): Promise<MarketSummary> => {
      const response = await apiClient.get<MarketSummary>(
        '/api/partner/market-intel/summary'
      );
      // apiClient returns data directly
      return response as unknown as MarketSummary;
    },
  });

  // Fetch competitor prices
  const { data: competitorPrices, isLoading: pricesLoading } = useQuery<
    CompetitorPrice[]
  >({
    queryKey: queryKeys.partner.marketIntel.competitors(),
    queryFn: async (): Promise<CompetitorPrice[]> => {
      const response = await apiClient.get<{ prices: CompetitorPrice[] }>(
        '/api/partner/market-intel/competitors'
      );
      // Extract prices from response
      const data = response as unknown as { prices: CompetitorPrice[] };
      return data.prices || [];
    },
  });

  // Add competitor mutation
  const addMutation = useMutation({
    mutationFn: async (data: AddCompetitorForm) => {
      return apiClient.post('/api/partner/market-intel/competitors', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.partner.marketIntel.competitors(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.partner.marketIntel.summary(),
      });
      toast.success('Kompetitor berhasil ditambahkan');
      setShowAddDialog(false);
      form.reset();
    },
    onError: () => {
      toast.error('Gagal menambahkan kompetitor');
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    addMutation.mutate(data);
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader
        title="Market Intelligence"
        description="Pantau harga kompetitor dan posisi pasar"
        action={
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Kompetitor</DialogTitle>
                <DialogDescription>
                  Pantau harga produk kompetitor secara manual
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="competitorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Kompetitor</FormLabel>
                        <FormControl>
                          <Input placeholder="Travel Agent XYZ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="productName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Produk/Paket</FormLabel>
                        <FormControl>
                          <Input placeholder="Paket Bali 3D2N" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="productUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Produk (Opsional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Link ke halaman produk
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga Saat Ini</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              Rp
                            </span>
                            <Input
                              type="number"
                              className="pl-9"
                              placeholder="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={addMutation.isPending}>
                      {addMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-4 px-4">
        {/* Info Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">
            Tentang Market Intelligence
          </AlertTitle>
          <AlertDescription className="text-blue-700">
            Fitur ini memungkinkan Anda melacak harga kompetitor secara manual.
            Update harga secara berkala untuk mendapat insight terbaik.
          </AlertDescription>
        </Alert>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          {summaryLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-14 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span className="text-xs">Dipantau</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold">
                    {summary?.totalTracked || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    produk kompetitor
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span className="text-xs">Index Kompetitif</span>
                  </div>
                  <p
                    className={cn(
                      'mt-1 text-2xl font-bold',
                      (summary?.competitiveIndex || 0) >= 50
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    )}
                  >
                    {summary?.competitiveIndex || 0}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs">Harga Rata-rata Pasar</span>
                  </div>
                  <p className="mt-1 text-lg font-bold">
                    {formatCurrency(summary?.averageMarketPrice || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span className="text-xs">Posisi Harga</span>
                  </div>
                  <Badge
                    className={cn(
                      'mt-1',
                      summary?.pricePosition === 'below'
                        ? 'bg-green-500'
                        : summary?.pricePosition === 'above'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                    )}
                  >
                    {summary?.pricePosition === 'below'
                      ? 'Di Bawah Pasar'
                      : summary?.pricePosition === 'above'
                        ? 'Di Atas Pasar'
                        : 'Sesuai Pasar'}
                  </Badge>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Competitive Position */}
        {!summaryLoading && summary && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Posisi Kompetitif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Harga Anda</span>
                    <span>Rata-rata Pasar</span>
                  </div>
                  <div className="relative mt-2 h-4 rounded-full bg-gray-200">
                    <div
                      className={cn(
                        'absolute top-0 h-4 rounded-full transition-all',
                        summary.pricePosition === 'below'
                          ? 'bg-green-500'
                          : summary.pricePosition === 'above'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                      )}
                      style={{
                        width: `${Math.min(100, (summary.ourAveragePrice / summary.averageMarketPrice) * 50)}%`,
                      }}
                    />
                    <div className="absolute left-1/2 top-0 h-4 w-0.5 bg-black" />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {formatCurrency(summary.ourAveragePrice)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(summary.averageMarketPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Competitor Prices List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Harga Kompetitor</CardTitle>
            <CardDescription>Update harga secara berkala</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {pricesLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : competitorPrices && competitorPrices.length > 0 ? (
              <ScrollArea className="max-h-[400px]">
                <div className="divide-y">
                  {competitorPrices.map((price) => (
                    <div
                      key={price.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{price.productName}</p>
                          {getTrendIcon(price.trend)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {price.competitorName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Updated{' '}
                          {formatDistanceToNow(new Date(price.lastUpdated), {
                            addSuffix: true,
                            locale: idLocale,
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {formatCurrency(price.currentPrice)}
                        </p>
                        {price.priceChange !== 0 && (
                          <p
                            className={cn(
                              'text-xs',
                              price.priceChange > 0
                                ? 'text-red-500'
                                : 'text-green-500'
                            )}
                          >
                            {price.priceChange > 0 ? '+' : ''}
                            {price.priceChangePercent.toFixed(1)}%
                          </p>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            'mt-1 text-xs',
                            price.priceDifference < 0
                              ? 'border-green-500 text-green-600'
                              : price.priceDifference > 0
                                ? 'border-red-500 text-red-600'
                                : ''
                          )}
                        >
                          {price.priceDifference < 0
                            ? 'Lebih Murah'
                            : price.priceDifference > 0
                              ? 'Lebih Mahal'
                              : 'Sama'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="font-medium">Belum ada data</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Tambahkan kompetitor untuk mulai memantau
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Kompetitor
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
