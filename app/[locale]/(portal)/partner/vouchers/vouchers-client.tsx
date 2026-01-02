/**
 * Gift Vouchers Client Component
 * Manage and track gift vouchers
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Gift,
  MoreHorizontal,
  Plus,
  Search,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/partner';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type VoucherStatus = 'active' | 'redeemed' | 'expired';

type Voucher = {
  id: string;
  code: string;
  amount: number;
  recipientName: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
  senderName: string;
  message: string | null;
  status: VoucherStatus;
  expiresAt: string;
  redeemedAt: string | null;
  createdAt: string;
};

type VoucherStats = {
  totalSold: number;
  totalValue: number;
  activeCount: number;
  activeValue: number;
  redeemedCount: number;
  redeemedValue: number;
  expiredCount: number;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: VoucherStatus) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-green-500">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Aktif
        </Badge>
      );
    case 'redeemed':
      return (
        <Badge className="bg-blue-500">
          <Gift className="mr-1 h-3 w-3" />
          Digunakan
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="secondary">
          <XCircle className="mr-1 h-3 w-3" />
          Expired
        </Badge>
      );
    default:
      return null;
  }
}

type VouchersClientProps = {
  locale: string;
};

export function VouchersClient({ locale }: VouchersClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'redeemed' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch voucher stats
  const { data: stats, isLoading: statsLoading } = useQuery<VoucherStats>({
    queryKey: queryKeys.partner.voucherStats,
    queryFn: async () => {
      const response = await apiClient.get<VoucherStats>('/api/partner/vouchers/stats');
      return response;
    },
  });

  // Fetch voucher list
  const { data: vouchers, isLoading: vouchersLoading } = useQuery<Voucher[]>({
    queryKey: queryKeys.partner.vouchers,
    queryFn: async () => {
      const response = await apiClient.get<{ vouchers: Voucher[] }>('/api/partner/vouchers');
      return response.vouchers;
    },
  });

  const filteredVouchers = vouchers?.filter((v) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'active' && v.status === 'active') ||
      (activeTab === 'redeemed' && v.status === 'redeemed') ||
      (activeTab === 'expired' && v.status === 'expired');

    const matchesSearch =
      !searchQuery ||
      v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.recipientName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader
        title="Gift Vouchers"
        description="Kelola voucher hadiah untuk customer"
        action={
          <Button size="sm" onClick={() => router.push(`/${locale}/partner/vouchers/purchase`)}>
            <Plus className="mr-2 h-4 w-4" />
            Beli Voucher
          </Button>
        }
      />

      <div className="space-y-4 px-4">
        {/* Stats */}
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
                    <Gift className="h-4 w-4" />
                    <span className="text-xs">Total Terjual</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold">{stats?.totalSold || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats?.totalValue || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs">Aktif</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-green-700">{stats?.activeCount || 0}</p>
                  <p className="text-xs text-green-600">
                    {formatCurrency(stats?.activeValue || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Gift className="h-4 w-4" />
                    <span className="text-xs">Digunakan</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-blue-700">{stats?.redeemedCount || 0}</p>
                  <p className="text-xs text-blue-600">
                    {formatCurrency(stats?.redeemedValue || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    <span className="text-xs">Expired</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold">{stats?.expiredCount || 0}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kode atau nama penerima..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Voucher List */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <div className="px-4 pt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Semua</TabsTrigger>
                  <TabsTrigger value="active">Aktif</TabsTrigger>
                  <TabsTrigger value="redeemed">Digunakan</TabsTrigger>
                  <TabsTrigger value="expired">Expired</TabsTrigger>
                </TabsList>
              </div>

              {vouchersLoading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredVouchers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Gift className="mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="font-medium">Belum ada voucher</p>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Beli voucher pertama Anda untuk hadiah customer
                  </p>
                  <Button onClick={() => router.push(`/${locale}/partner/vouchers/purchase`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Beli Voucher
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="divide-y">
                    {filteredVouchers.map((voucher) => (
                      <div
                        key={voucher.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-medium">{voucher.code}</p>
                            {getStatusBadge(voucher.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Untuk: {voucher.recipientName}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-medium text-green-600">
                              {formatCurrency(voucher.amount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Exp: {format(new Date(voucher.expiresAt), 'd MMM yyyy', {
                                locale: idLocale,
                              })}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/${locale}/partner/vouchers/${voucher.id}`)
                              }
                            >
                              Lihat Detail
                            </DropdownMenuItem>
                            {voucher.status === 'active' && (
                              <DropdownMenuItem>Resend Email</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

