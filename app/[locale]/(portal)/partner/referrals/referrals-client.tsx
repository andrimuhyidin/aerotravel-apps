/**
 * Partner Referrals Client Component
 * Track referral codes, stats, and commissions
 */

'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Clock,
  Copy,
  Gift,
  Link,
  QrCode,
  RefreshCw,
  Share2,
  Trophy,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/partner';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type ReferralStats = {
  referralCode: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  expiredReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  conversionRate: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextTierAt: number;
};

type Referral = {
  id: string;
  refereeName: string;
  refereePhone: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  referrerPoints: number;
  refereeDiscount: number;
  bookingId: string | null;
  bookingCode: string | null;
  completedAt: string | null;
  createdAt: string;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadge(status: Referral['status']) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-500">Selesai</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500">Pending</Badge>;
    case 'expired':
      return <Badge variant="secondary">Expired</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Dibatalkan</Badge>;
    default:
      return null;
  }
}

type ReferralsClientProps = {
  locale: string;
};

export function ReferralsClient({ locale }: ReferralsClientProps) {
  const queryClient = useQueryClient();
  const [showQRDialog, setShowQRDialog] = useState(false);

  // Fetch referral stats
  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: queryKeys.partner.referralStats,
    queryFn: async () => {
      const response = await apiClient.get<ReferralStats>('/api/partner/referrals/stats');
      return response;
    },
  });

  // Fetch referral list
  const { data: referrals, isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: queryKeys.partner.referrals,
    queryFn: async () => {
      const response = await apiClient.get<{ referrals: Referral[] }>('/api/partner/referrals');
      return response.referrals;
    },
  });

  // Generate new referral code
  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/api/partner/referrals/generate');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partner.referralStats });
      toast.success('Kode referral baru berhasil dibuat!');
    },
    onError: () => {
      toast.error('Gagal membuat kode referral');
    },
  });

  const copyReferralCode = useCallback(() => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      toast.success('Kode referral disalin!');
    }
  }, [stats?.referralCode]);

  const copyReferralLink = useCallback(() => {
    if (stats?.referralCode) {
      const link = `${window.location.origin}/register?ref=${stats.referralCode}`;
      navigator.clipboard.writeText(link);
      toast.success('Link referral disalin!');
    }
  }, [stats?.referralCode]);

  const shareReferral = useCallback(() => {
    if (stats?.referralCode && navigator.share) {
      navigator.share({
        title: 'Daftar di MyAeroTravel',
        text: `Gunakan kode referral saya ${stats.referralCode} untuk mendapatkan diskon Rp 50.000 pada booking pertamamu!`,
        url: `${window.location.origin}/register?ref=${stats.referralCode}`,
      });
    } else {
      copyReferralLink();
    }
  }, [stats?.referralCode, copyReferralLink]);

  const tierProgress = stats
    ? Math.min(100, (stats.completedReferrals / stats.nextTierAt) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader
        title="Referrals"
        description="Kelola kode referral dan pantau komisi"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateCodeMutation.mutate()}
            disabled={generateCodeMutation.isPending}
          >
            <RefreshCw
              className={cn(
                'mr-2 h-4 w-4',
                generateCodeMutation.isPending && 'animate-spin'
              )}
            />
            Kode Baru
          </Button>
        }
      />

      <div className="space-y-4 px-4">
        {/* Referral Code Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
          <CardContent className="p-4">
            {statsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24 bg-white/20" />
                <Skeleton className="h-10 w-40 bg-white/20" />
              </div>
            ) : (
              <>
                <p className="mb-1 text-sm text-white/80">Kode Referral Anda</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-2xl font-bold tracking-wider">
                    {stats?.referralCode || 'PARTNER-XXXX'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-white hover:bg-white/20"
                      onClick={copyReferralCode}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-white hover:bg-white/20"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>QR Code Referral</DialogTitle>
                          <DialogDescription>
                            Scan QR code ini untuk mendaftar dengan kode referral Anda
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center p-4">
                          <div className="mb-4 rounded-lg bg-white p-4">
                            {/* Placeholder for QR Code - would use qrcode library */}
                            <div className="flex h-48 w-48 items-center justify-center bg-gray-100 text-gray-400">
                              <QrCode className="h-16 w-16" />
                            </div>
                          </div>
                          <p className="font-mono text-lg font-bold">
                            {stats?.referralCode}
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-white hover:bg-white/20"
                      onClick={shareReferral}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={copyReferralLink}
                  >
                    <Link className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={shareReferral}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              {statsLoading ? (
                <Skeleton className="h-14 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Total Referral</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold">{stats?.totalReferrals || 0}</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              {statsLoading ? (
                <Skeleton className="h-14 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-xs">Selesai</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    {stats?.completedReferrals || 0}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              {statsLoading ? (
                <Skeleton className="h-14 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs">Pending</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-yellow-600">
                    {stats?.pendingReferrals || 0}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              {statsLoading ? (
                <Skeleton className="h-14 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-xs">Konversi</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-blue-600">
                    {stats?.conversionRate.toFixed(0) || 0}%
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Earnings Card */}
        <Card className="bg-green-50">
          <CardContent className="p-4">
            {statsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Total Pendapatan</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(stats?.totalEarnings || 0)}
                  </p>
                  <p className="text-xs text-green-600">
                    + {formatCurrency(stats?.pendingEarnings || 0)} pending
                  </p>
                </div>
                <div className="rounded-full bg-green-100 p-4">
                  <Gift className="h-8 w-8 text-green-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tier Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Tier Referral
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <Badge
                    className={cn(
                      'capitalize',
                      stats?.tier === 'bronze' && 'bg-amber-600',
                      stats?.tier === 'silver' && 'bg-gray-400',
                      stats?.tier === 'gold' && 'bg-yellow-500',
                      stats?.tier === 'platinum' && 'bg-indigo-500'
                    )}
                  >
                    {stats?.tier || 'bronze'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {stats?.completedReferrals || 0} / {stats?.nextTierAt || 10} referral
                  </span>
                </div>
                <Progress value={tierProgress} className="h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {stats?.nextTierAt
                    ? `${stats.nextTierAt - (stats.completedReferrals || 0)} referral lagi untuk tier berikutnya`
                    : 'Anda sudah di tier tertinggi!'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Referral List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daftar Referral</CardTitle>
            <CardDescription>Semua referral yang menggunakan kode Anda</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all">
              <div className="px-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">Semua</TabsTrigger>
                  <TabsTrigger value="completed">Selesai</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                </TabsList>
              </div>

              {referralsLoading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <TabsContent value="all" className="mt-0">
                    <ReferralList referrals={referrals || []} />
                  </TabsContent>
                  <TabsContent value="completed" className="mt-0">
                    <ReferralList
                      referrals={(referrals || []).filter((r) => r.status === 'completed')}
                    />
                  </TabsContent>
                  <TabsContent value="pending" className="mt-0">
                    <ReferralList
                      referrals={(referrals || []).filter((r) => r.status === 'pending')}
                    />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cara Kerja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  1
                </div>
                <div>
                  <p className="font-medium">Bagikan Kode</p>
                  <p className="text-sm text-muted-foreground">
                    Bagikan kode referral Anda ke calon customer
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  2
                </div>
                <div>
                  <p className="font-medium">Customer Daftar</p>
                  <p className="text-sm text-muted-foreground">
                    Customer mendaftar menggunakan kode Anda dan dapat diskon Rp 50.000
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  3
                </div>
                <div>
                  <p className="font-medium">Dapatkan Reward</p>
                  <p className="text-sm text-muted-foreground">
                    Anda dapat 10.000 poin setelah trip customer selesai
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReferralList({ referrals }: { referrals: Referral[] }) {
  if (referrals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Belum ada referral</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="divide-y">
        {referrals.map((referral) => (
          <div key={referral.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{referral.refereeName}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(referral.createdAt), 'd MMM yyyy', { locale: idLocale })}
                </p>
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(referral.status)}
              {referral.status === 'completed' && (
                <p className="mt-1 text-xs text-green-600">
                  +{referral.referrerPoints.toLocaleString()} poin
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

