/**
 * Corporate Dashboard Client Component
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CalendarCheck,
  CheckSquare,
  CreditCard,
  FileText,
  Loader2,
  Package,
  Plus,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';

type DashboardResponse = {
  corporate: {
    id: string;
    companyName: string;
    picName: string | null;
    creditLimit: number;
  };
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    pendingInvitations: number;
    totalAllocated: number;
    totalUsed: number;
    remainingBudget: number;
    depositBalance: number;
    pendingApprovals: number;
    recentBookings: number;
  };
};

type CorporateDashboardClientProps = {
  locale: string;
};

export function CorporateDashboardClient({
  locale,
}: CorporateDashboardClientProps) {
  const {
    data,
    isLoading,
    error,
  } = useQuery<DashboardResponse>({
    queryKey: ['corporate', 'dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/api/partner/corporate/dashboard');
      return response.data as DashboardResponse;
    },
  });

  if (error) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">
          Anda tidak memiliki akses corporate
        </p>
        <Button asChild className="mt-4">
          <Link href={`/${locale}/corporate/apply`}>Daftar Corporate</Link>
        </Button>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-90">Selamat datang,</p>
            {isLoading ? (
              <Skeleton className="h-7 w-40 mt-1 bg-white/20" />
            ) : (
              <h1 className="text-xl font-bold">
                {data?.corporate.companyName}
              </h1>
            )}
            {data?.corporate.picName && (
              <p className="text-sm opacity-80 mt-1">
                PIC: {data.corporate.picName}
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
            <Building2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold">
                    {data?.stats.totalEmployees || 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Karyawan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <p className="text-lg font-bold">
                    {formatCurrency(data?.stats.depositBalance || 0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Saldo Deposit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Alokasi</span>
              {isLoading ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <span className="font-medium">
                  {formatCurrency(data?.stats.totalAllocated || 0)}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Terpakai</span>
              {isLoading ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <span className="font-medium text-red-600">
                  {formatCurrency(data?.stats.totalUsed || 0)}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Sisa Budget</span>
              {isLoading ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <span className="font-bold text-green-600">
                  {formatCurrency(data?.stats.remainingBudget || 0)}
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {!isLoading && data && data.stats.totalAllocated > 0 && (
            <div className="mt-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      (data.stats.totalUsed / data.stats.totalAllocated) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {Math.round(
                  (data.stats.totalUsed / data.stats.totalAllocated) * 100
                )}
                % terpakai
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/${locale}/corporate/packages`}>
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Katalog Paket</p>
                  <p className="text-xs text-muted-foreground">Cari paket travel</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/corporate/bookings/new`}>
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <CalendarCheck className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Booking Baru</p>
                  <p className="text-xs text-muted-foreground">Buat booking</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/corporate/approvals`}>
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <CheckSquare className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Approvals</p>
                  <p className="text-xs text-muted-foreground">
                    {data?.stats.pendingApprovals || 0} pending
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/corporate/employees`}>
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Karyawan</p>
                  <p className="text-xs text-muted-foreground">
                    {data?.stats.activeEmployees || 0} aktif
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/corporate/reports`}>
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                  <BarChart3 className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Laporan</p>
                  <p className="text-xs text-muted-foreground">Analisis spending</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${locale}/corporate/ai`}>
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full bg-gradient-to-br from-violet-50 to-fuchsia-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">AI Assistant</p>
                  <p className="text-xs text-muted-foreground">Tanya AI</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Pending Items */}
      {!isLoading &&
        data &&
        (data.stats.pendingInvitations > 0 ||
          data.stats.pendingApprovals > 0) && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-800">
                Perlu Perhatian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.stats.pendingInvitations > 0 && (
                <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <span className="text-sm">
                    {data.stats.pendingInvitations} undangan menunggu
                  </span>
                  <Link href={`/${locale}/corporate/employees?status=invited`}>
                    <Button variant="ghost" size="sm">
                      Lihat
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
              {data.stats.pendingApprovals > 0 && (
                <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <span className="text-sm">
                    {data.stats.pendingApprovals} booking perlu approval
                  </span>
                  <Link href={`/${locale}/corporate/approvals`}>
                    <Button variant="ghost" size="sm">
                      Lihat
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Add Employee CTA */}
      <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
        <CardContent className="py-6 text-center">
          <Plus className="h-8 w-8 mx-auto text-primary/50 mb-2" />
          <p className="font-medium mb-1">Tambah Karyawan Baru</p>
          <p className="text-xs text-muted-foreground mb-4">
            Daftarkan karyawan untuk alokasi budget travel
          </p>
          <Button asChild>
            <Link href={`/${locale}/corporate/employees?action=add`}>
              Tambah Karyawan
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

