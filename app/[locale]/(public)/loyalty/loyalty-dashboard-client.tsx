/**
 * Loyalty Dashboard Client Component
 * Displays AeroPoints balance, history, rewards catalog, and how-to information
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  Coins,
  Copy,
  Gift,
  HelpCircle,
  History,
  Loader2,
  Package,
  Share2,
  ShoppingCart,
  Sparkles,
  Star,
  Ticket,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api/client';

type PointsBalance = {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  valueInRupiah: number;
};

type PointsTransaction = {
  id: string;
  transactionType: string;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  bookingId: string | null;
  referralCode: string | null;
  description: string | null;
  createdAt: string;
  expiresAt?: string;
};

type Reward = {
  id: string;
  name: string;
  description: string;
  category: 'voucher' | 'discount' | 'merchandise' | 'experience';
  pointsCost: number;
  valueInRupiah: number;
  imageUrl: string | null;
  isAvailable: boolean;
  stock: number | null;
  validUntil: string | null;
  terms: string[];
  canRedeem: boolean;
  pointsShortfall: number;
};

type RewardCategory = {
  id: string;
  name: string;
  count: number;
};

type LoyaltyDashboardClientProps = {
  locale: string;
};

export function LoyaltyDashboardClient({ locale }: LoyaltyDashboardClientProps) {
  const [historyPage, setHistoryPage] = useState(0);
  const [activeTab, setActiveTab] = useState('rewards');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [rewardCategory, setRewardCategory] = useState<string>('all');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const limit = 10;

  // Fetch balance
  const {
    data: balance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useQuery<PointsBalance>({
    queryKey: ['loyalty', 'balance'],
    queryFn: async () => {
      const response = await apiClient.get('/api/user/loyalty/balance');
      return response.data as PointsBalance;
    },
  });

  // Fetch history
  const {
    data: historyData,
    isLoading: historyLoading,
    isFetching: historyFetching,
  } = useQuery<{
    transactions: PointsTransaction[];
    pagination: { limit: number; offset: number; hasMore: boolean };
  }>({
    queryKey: ['loyalty', 'history', historyPage],
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/user/loyalty/history?limit=${limit}&offset=${historyPage * limit}`
      );
      return response.data as {
        transactions: PointsTransaction[];
        pagination: { limit: number; offset: number; hasMore: boolean };
      };
    },
  });

  // Fetch rewards catalog
  const { data: rewardsData, isLoading: rewardsLoading } = useQuery<{
    rewards: Reward[];
    userBalance: number;
    categories: RewardCategory[];
  }>({
    queryKey: ['loyalty', 'rewards', rewardCategory],
    queryFn: async () => {
      const params = rewardCategory !== 'all' ? `?category=${rewardCategory}` : '';
      const response = await apiClient.get(`/api/user/loyalty/rewards${params}`);
      return response.data as {
        rewards: Reward[];
        userBalance: number;
        categories: RewardCategory[];
      };
    },
  });

  // Fetch referral stats
  const { data: referralData } = useQuery<{
    referralCode: string;
    totalReferred: number;
    pendingRewards: number;
  }>({
    queryKey: ['referral', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/user/referral/stats');
      return response.data as {
        referralCode: string;
        totalReferred: number;
        pendingRewards: number;
      };
    },
  });

  const handleShareReferral = async () => {
    if (!referralData?.referralCode) return;
    
    const shareUrl = `${window.location.origin}/${locale}/packages?ref=${referralData.referralCode}`;
    const shareText = `Yuk booking trip seru di Aero Travel! Pakai kode referral ${referralData.referralCode} untuk dapat diskon. ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Referral Aero Travel',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link referral berhasil disalin!');
    }
  };

  const handleCopyReferralCode = async () => {
    if (!referralData?.referralCode) return;
    await navigator.clipboard.writeText(referralData.referralCode);
    toast.success('Kode referral berhasil disalin!');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'voucher':
        return <Ticket className="h-5 w-5" />;
      case 'discount':
        return <Star className="h-5 w-5" />;
      case 'merchandise':
        return <Package className="h-5 w-5" />;
      case 'experience':
        return <Sparkles className="h-5 w-5" />;
      default:
        return <Gift className="h-5 w-5" />;
    }
  };

  const formatTransactionType = (type: string): { label: string; icon: typeof ArrowUp; color: string } => {
    switch (type) {
      case 'earn_booking':
        return { label: 'Poin Booking', icon: ShoppingCart, color: 'text-green-600' };
      case 'earn_referral':
        return { label: 'Bonus Referral', icon: Users, color: 'text-blue-600' };
      case 'earn_review':
        return { label: 'Bonus Review', icon: Star, color: 'text-amber-600' };
      case 'redeem':
        return { label: 'Redeem Poin', icon: Ticket, color: 'text-red-600' };
      case 'expire':
        return { label: 'Kadaluarsa', icon: History, color: 'text-gray-500' };
      case 'adjustment':
        return { label: 'Penyesuaian', icon: ArrowUp, color: 'text-purple-600' };
      default:
        return { label: type, icon: Coins, color: 'text-gray-600' };
    }
  };

  if (balanceError) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Silakan login untuk melihat AeroPoints Anda</p>
        <Button asChild className="mt-4">
          <Link href={`/${locale}/auth/login?redirect=/loyalty`}>Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Points Balance Card */}
      <Card className="border-none bg-gradient-to-br from-amber-500 via-amber-400 to-orange-400 text-white shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
              <Coins className="h-8 w-8" />
            </div>
            <p className="text-sm opacity-90">Saldo AeroPoints</p>
            {balanceLoading ? (
              <Skeleton className="h-12 w-40 mx-auto mt-2 bg-white/20" />
            ) : (
              <h2 className="text-4xl font-bold mt-1">
                {(balance?.balance || 0).toLocaleString('id-ID')}
              </h2>
            )}
            <p className="text-sm opacity-90 mt-1">
              = Rp {(balance?.valueInRupiah || 0).toLocaleString('id-ID')}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4" />
                <span className="text-xs opacity-80">Total Didapat</span>
              </div>
              <p className="font-bold mt-1">
                {(balance?.lifetimeEarned || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4" />
                <span className="text-xs opacity-80">Total Dipakai</span>
              </div>
              <p className="font-bold mt-1">
                {(balance?.lifetimeSpent || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Code Card */}
      {referralData?.referralCode && (
        <Card className="border-none bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Kode Referral Kamu</p>
                <p className="text-2xl font-bold tracking-wider mt-1">{referralData.referralCode}</p>
                <p className="text-xs opacity-80 mt-1">
                  {referralData.totalReferred} teman sudah menggunakan kode ini
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30"
                  onClick={handleCopyReferralCode}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30"
                  onClick={handleShareReferral}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/${locale}/packages`}>
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Booking Sekarang</p>
                <p className="text-xs text-muted-foreground">Dapat poin setiap booking</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/referral`}>
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Ajak Teman</p>
                <p className="text-xs text-muted-foreground">Bonus 10,000 poin</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Tabs: Rewards / History / How */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="history">Riwayat</TabsTrigger>
          <TabsTrigger value="how">Info</TabsTrigger>
        </TabsList>

        {/* Rewards Catalog Tab */}
        <TabsContent value="rewards" className="mt-4 space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <Button
              variant={rewardCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRewardCategory('all')}
              className="shrink-0"
            >
              Semua
            </Button>
            {rewardsData?.categories.map((cat) => (
              <Button
                key={cat.id}
                variant={rewardCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRewardCategory(cat.id)}
                className="shrink-0 gap-1"
              >
                {getCategoryIcon(cat.id)}
                {cat.name}
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {cat.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Rewards Grid */}
          {rewardsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : !rewardsData?.rewards.length ? (
            <div className="text-center py-12">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Tidak ada reward di kategori ini</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {rewardsData.rewards.map((reward) => (
                <Card
                  key={reward.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    reward.canRedeem ? '' : 'opacity-70'
                  }`}
                  onClick={() => setSelectedReward(reward)}
                >
                  <CardContent className="p-3">
                    {/* Icon */}
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-2 ${
                      reward.category === 'voucher' ? 'bg-green-100 text-green-600' :
                      reward.category === 'discount' ? 'bg-amber-100 text-amber-600' :
                      reward.category === 'merchandise' ? 'bg-purple-100 text-purple-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {getCategoryIcon(reward.category)}
                    </div>

                    {/* Info */}
                    <h3 className="font-medium text-sm line-clamp-2">{reward.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {reward.description}
                    </p>

                    {/* Price */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-primary">
                        <Coins className="h-3 w-3" />
                        <span className="text-sm font-bold">{reward.pointsCost.toLocaleString('id-ID')}</span>
                      </div>
                      {reward.stock !== null && reward.stock < 20 && (
                        <Badge variant="secondary" className="text-[10px]">
                          Sisa {reward.stock}
                        </Badge>
                      )}
                    </div>

                    {/* Shortfall indicator */}
                    {reward.pointsShortfall > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Kurang {reward.pointsShortfall.toLocaleString('id-ID')} poin
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="how" className="mt-4 space-y-4">
          {/* How to Earn */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-600" />
                Cara Dapat Poin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Booking Trip</p>
                  <p className="text-xs text-muted-foreground">
                    Setiap Rp 100.000 = 10 Poin
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Referral</p>
                  <p className="text-xs text-muted-foreground">
                    +10,000 poin setiap teman booking
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Star className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Review Trip</p>
                  <p className="text-xs text-muted-foreground">
                    +50 poin untuk setiap review
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to Redeem */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" />
                Cara Pakai Poin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-primary/5 rounded-lg text-center">
                <p className="text-2xl font-bold text-primary">1 Poin = Rp 1</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Gunakan sebagai potongan harga saat checkout
                </p>
                <Button asChild className="mt-4 w-full">
                  <Link href={`/${locale}/packages`}>
                    Gunakan Poin Sekarang
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                FAQ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Apakah poin bisa kadaluarsa?</p>
                <p className="text-muted-foreground text-xs">
                  Poin berlaku 12 bulan sejak didapat.
                </p>
              </div>
              <div>
                <p className="font-medium">Minimal poin yang bisa dipakai?</p>
                <p className="text-muted-foreground text-xs">
                  Tidak ada minimal. Gunakan sesuai kebutuhan.
                </p>
              </div>
              <div>
                <p className="font-medium">Bagaimana cara cek riwayat poin?</p>
                <p className="text-muted-foreground text-xs">
                  Klik tab &quot;Riwayat&quot; di atas untuk melihat semua transaksi.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                Riwayat Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !historyData?.transactions.length ? (
                <div className="text-center py-8">
                  <Coins className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">Belum ada riwayat transaksi</p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link href={`/${locale}/packages`}>Mulai Booking</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyData.transactions.map((tx) => {
                    const typeInfo = formatTransactionType(tx.transactionType);
                    const Icon = typeInfo.icon;
                    const isPositive = tx.points > 0;

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            isPositive ? 'bg-green-100' : 'bg-red-100'
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              isPositive ? 'text-green-600' : 'text-red-600'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {tx.description || typeInfo.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.createdAt), 'd MMM yyyy, HH:mm', {
                              locale: id,
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold ${
                              isPositive ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {tx.points.toLocaleString('id-ID')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Saldo: {tx.balanceAfter.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  <div className="flex justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                      disabled={historyPage === 0 || historyFetching}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage((p) => p + 1)}
                      disabled={!historyData?.pagination.hasMore || historyFetching}
                    >
                      {historyFetching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reward Detail Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent className="max-w-md">
          {selectedReward && (
            <>
              <DialogHeader>
                <div className={`h-16 w-16 rounded-xl flex items-center justify-center mb-2 ${
                  selectedReward.category === 'voucher' ? 'bg-green-100 text-green-600' :
                  selectedReward.category === 'discount' ? 'bg-amber-100 text-amber-600' :
                  selectedReward.category === 'merchandise' ? 'bg-purple-100 text-purple-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {getCategoryIcon(selectedReward.category)}
                </div>
                <DialogTitle>{selectedReward.name}</DialogTitle>
                <DialogDescription>{selectedReward.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Points Cost */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Poin Dibutuhkan</span>
                  <div className="flex items-center gap-1 text-primary font-bold">
                    <Coins className="h-4 w-4" />
                    {selectedReward.pointsCost.toLocaleString('id-ID')}
                  </div>
                </div>

                {/* Value if applicable */}
                {selectedReward.valueInRupiah > 0 && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Nilai</span>
                    <span className="font-medium">Rp {selectedReward.valueInRupiah.toLocaleString('id-ID')}</span>
                  </div>
                )}

                {/* Stock */}
                {selectedReward.stock !== null && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Stok Tersedia</span>
                    <Badge variant={selectedReward.stock < 10 ? 'destructive' : 'secondary'}>
                      {selectedReward.stock} tersisa
                    </Badge>
                  </div>
                )}

                {/* Terms */}
                {selectedReward.terms.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Syarat & Ketentuan:</p>
                    <ul className="space-y-1">
                      {selectedReward.terms.map((term, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                          {term}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Shortfall Warning */}
                {selectedReward.pointsShortfall > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-amber-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="text-sm">
                      Kamu butuh {selectedReward.pointsShortfall.toLocaleString('id-ID')} poin lagi
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedReward(null)}>
                  Batal
                </Button>
                <Button
                  disabled={!selectedReward.canRedeem || isRedeeming}
                  onClick={() => {
                    // In a real implementation, this would trigger redemption
                    setIsRedeeming(true);
                    setTimeout(() => {
                      toast.success('Reward berhasil ditukar! Cek email untuk detailnya.');
                      setSelectedReward(null);
                      setIsRedeeming(false);
                    }, 1500);
                  }}
                >
                  {isRedeeming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      Tukar Sekarang
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

