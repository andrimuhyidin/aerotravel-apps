/**
 * CLV Dashboard Client Component
 * Customer Lifetime Value analysis with churn prediction
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ChevronRight,
  Crown,
  DollarSign,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/partner';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type CLVStats = {
  totalCustomers: number;
  averageCLV: number;
  totalRevenue: number;
  averageOrderValue: number;
  repeatCustomerRate: number;
  highValueCustomers: number;
  atRiskCustomers: number;
};

type CustomerCLV = {
  id: string;
  name: string;
  phone: string;
  segment: 'high' | 'medium' | 'low';
  clv: number;
  totalSpent: number;
  orderCount: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
  daysSinceLastOrder: number;
  churnRisk: 'high' | 'medium' | 'low';
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getSegmentBadge(segment: CustomerCLV['segment']) {
  switch (segment) {
    case 'high':
      return (
        <Badge className="bg-amber-500">
          <Crown className="mr-1 h-3 w-3" />
          VIP
        </Badge>
      );
    case 'medium':
      return <Badge className="bg-blue-500">Medium</Badge>;
    case 'low':
    default:
      return <Badge variant="secondary">Low</Badge>;
  }
}

function getChurnRiskBadge(risk: CustomerCLV['churnRisk']) {
  switch (risk) {
    case 'high':
      return (
        <Badge variant="destructive">
          <AlertTriangle className="mr-1 h-3 w-3" />
          High Risk
        </Badge>
      );
    case 'medium':
      return (
        <Badge className="bg-yellow-500">
          Medium
        </Badge>
      );
    case 'low':
    default:
      return (
        <Badge className="bg-green-500">
          Low
        </Badge>
      );
  }
}

type CLVDashboardClientProps = {
  locale: string;
};

export function CLVDashboardClient({ locale }: CLVDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'high' | 'at-risk'>('all');

  // Fetch CLV stats
  const { data: stats, isLoading: statsLoading } = useQuery<CLVStats>({
    queryKey: queryKeys.partner.clvStats,
    queryFn: async () => {
      const response = await apiClient.get<CLVStats>('/api/partner/analytics/clv');
      return response;
    },
  });

  // Fetch customer CLV list
  const { data: customers, isLoading: customersLoading } = useQuery<CustomerCLV[]>({
    queryKey: queryKeys.partner.clvCustomers,
    queryFn: async () => {
      const response = await apiClient.get<{ customers: CustomerCLV[] }>(
        '/api/partner/analytics/clv/customers'
      );
      return response.customers;
    },
  });

  const filteredCustomers = customers?.filter((c) => {
    if (activeTab === 'high') return c.segment === 'high';
    if (activeTab === 'at-risk') return c.churnRisk === 'high';
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader
        title="Customer Lifetime Value"
        description="Analisis nilai pelanggan dan risiko churn"
        backHref={`/${locale}/partner/analytics`}
      />

      <div className="space-y-4 px-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {statsLoading ? (
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
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-xs">Avg CLV</span>
                  </div>
                  <p className="mt-1 text-xl font-bold text-green-600">
                    {formatCurrency(stats?.averageCLV || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-xs">Avg Order</span>
                  </div>
                  <p className="mt-1 text-xl font-bold text-blue-600">
                    {formatCurrency(stats?.averageOrderValue || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span className="text-xs">VIP Customers</span>
                  </div>
                  <p className="mt-1 text-xl font-bold text-amber-600">
                    {stats?.highValueCustomers || 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-xs">At Risk</span>
                  </div>
                  <p className="mt-1 text-xl font-bold text-red-600">
                    {stats?.atRiskCustomers || 0}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Repeat Customer Rate */}
        {!statsLoading && stats && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Repeat Customer Rate</span>
                <span className="text-sm font-medium">
                  {stats.repeatCustomerRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={stats.repeatCustomerRate} className="mt-2 h-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.repeatCustomerRate > 30
                  ? '✅ Great! Above industry average'
                  : '⚠️ Below average - focus on retention'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Customer Segmentation Summary */}
        {!customersLoading && customers && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-primary" />
                Customer Segmentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {['high', 'medium', 'low'].map((seg) => {
                  const count = customers.filter((c) => c.segment === seg).length;
                  const percentage = customers.length > 0 
                    ? (count / customers.length) * 100 
                    : 0;
                  
                  return (
                    <div
                      key={seg}
                      className={cn(
                        'flex-1 rounded-lg p-3 text-center',
                        seg === 'high' && 'bg-amber-50',
                        seg === 'medium' && 'bg-blue-50',
                        seg === 'low' && 'bg-gray-100'
                      )}
                    >
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {seg === 'high' ? 'VIP' : seg}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ({percentage.toFixed(0)}%)
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Customer CLV</CardTitle>
            <CardDescription>Sorted by lifetime value</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <div className="px-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">Semua</TabsTrigger>
                  <TabsTrigger value="high">VIP</TabsTrigger>
                  <TabsTrigger value="at-risk">At Risk</TabsTrigger>
                </TabsList>
              </div>

              {customersLoading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Tidak ada customer dalam kategori ini
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="divide-y">
                    {filteredCustomers.map((customer, index) => (
                      <div
                        key={customer.id}
                        className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50"
                        onClick={() =>
                          router.push(`/${locale}/partner/customers/${customer.id}`)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-full',
                              customer.segment === 'high'
                                ? 'bg-amber-100 text-amber-600'
                                : customer.segment === 'medium'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            {customer.segment === 'high' ? (
                              <Crown className="h-5 w-5" />
                            ) : (
                              <span className="text-sm font-bold">#{index + 1}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{customer.name}</p>
                              {getChurnRiskBadge(customer.churnRisk)}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{customer.orderCount} orders</span>
                              <span>
                                Last: {customer.lastOrderDate
                                  ? formatDistanceToNow(new Date(customer.lastOrderDate), {
                                      addSuffix: true,
                                      locale: idLocale,
                                    })
                                  : 'Never'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {formatCurrency(customer.clv)}
                          </p>
                          <p className="text-xs text-muted-foreground">CLV</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-blue-800">
              <Star className="h-5 w-5" />
              Rekomendasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 shrink-0" />
              <p>Berikan promo eksklusif untuk {stats?.highValueCustomers || 0} customer VIP Anda</p>
            </div>
            <div className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 shrink-0" />
              <p>
                Hubungi {stats?.atRiskCustomers || 0} customer at-risk sebelum mereka churn
              </p>
            </div>
            <div className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 shrink-0" />
              <p>Tingkatkan repeat rate dengan program loyalty</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

