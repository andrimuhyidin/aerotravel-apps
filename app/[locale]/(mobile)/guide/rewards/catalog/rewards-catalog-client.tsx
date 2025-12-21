/**
 * Rewards Catalog Client Component
 * Browse and redeem rewards
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Coins, Filter, Gift, Loader2, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Container } from '@/components/layout/container';
import queryKeys from '@/lib/queries/query-keys';

type RewardCatalogItem = {
  id: string;
  reward_type: 'cashback' | 'voucher' | 'merchandise' | 'benefit' | 'discount';
  title: string;
  description: string | null;
  points_cost: number;
  cash_value: number | null;
  voucher_provider: string | null;
  merchandise_name: string | null;
  benefit_description: string | null;
  discount_percentage: number | null;
  discount_max_amount: number | null;
  stock_quantity: number | null;
  min_level: string | null;
  image_url: string | null;
  terms_conditions: string | null;
};

type RewardCatalogData = {
  rewards: RewardCatalogItem[];
};

type RewardPointsData = {
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  expiredPoints: number;
  expiringSoon: {
    total: number;
    details: Array<{ points: number; expiresAt: string }>;
    warningDays: number;
  };
};

type RewardsCatalogClientProps = {
  locale: string;
};

export function RewardsCatalogClient({ locale }: RewardsCatalogClientProps) {
  const queryClient = useQueryClient();
  const [selectedReward, setSelectedReward] = useState<RewardCatalogItem | null>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Fetch points balance
  const { data: pointsData } = useQuery<RewardPointsData>({
    queryKey: queryKeys.guide.rewardPoints(),
    queryFn: async () => {
      const res = await fetch('/api/guide/rewards/points');
      if (!res.ok) throw new Error('Failed to fetch reward points');
      return res.json();
    },
  });

  // Fetch catalog
  const { data: catalogData, isLoading: catalogLoading } = useQuery<RewardCatalogData>({
    queryKey: [...queryKeys.guide.rewardCatalog(), filterType],
    queryFn: async () => {
      const url = filterType === 'all' 
        ? '/api/guide/rewards/catalog'
        : `/api/guide/rewards/catalog?type=${filterType}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch catalog');
      return res.json();
    },
  });

  // Redeem mutation
  const redeemMutation = useMutation({
    mutationFn: async (catalogId: string) => {
      const body: { catalog_id: string; delivery_info?: { address: string; phone: string; notes?: string } } = {
        catalog_id: catalogId,
      };

      // Add delivery info if merchandise
      if (selectedReward?.reward_type === 'merchandise') {
        if (!deliveryAddress.trim() || !deliveryPhone.trim()) {
          throw new Error('Alamat dan nomor telepon wajib diisi untuk merchandise');
        }
        body.delivery_info = {
          address: deliveryAddress.trim(),
          phone: deliveryPhone.trim(),
          notes: deliveryNotes.trim() || undefined,
        };
      }

      const res = await fetch('/api/guide/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to redeem reward');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Reward berhasil ditukar!', {
        description: data.voucherCode 
          ? `Kode voucher: ${data.voucherCode}`
          : 'Reward Anda sedang diproses',
      });
      setShowRedeemDialog(false);
      setSelectedReward(null);
      // Reset delivery form
      setDeliveryAddress('');
      setDeliveryPhone('');
      setDeliveryNotes('');
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.rewardPoints() });
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.rewardRedemptions() });
    },
    onError: (error: Error) => {
      toast.error('Gagal menukar reward', {
        description: error.message,
      });
    },
  });

  const balance = pointsData?.balance || 0;
  const rewards = catalogData?.rewards || [];

  const handleRedeem = (reward: RewardCatalogItem) => {
    if (balance < reward.points_cost) {
      toast.error('Poin tidak cukup', {
        description: `Anda memerlukan ${reward.points_cost.toLocaleString('id-ID')} poin`,
      });
      return;
    }
    setSelectedReward(reward);
    // Reset delivery form when opening dialog
    setDeliveryAddress('');
    setDeliveryPhone('');
    setDeliveryNotes('');
    setShowRedeemDialog(true);
  };

  const confirmRedeem = () => {
    if (!selectedReward) return;

    // Validate delivery info for merchandise
    if (selectedReward.reward_type === 'merchandise') {
      if (!deliveryAddress.trim()) {
        toast.error('Alamat pengiriman wajib diisi');
        return;
      }
      if (!deliveryPhone.trim()) {
        toast.error('Nomor telepon wajib diisi');
        return;
      }
    }

    redeemMutation.mutate(selectedReward.id);
  };

  const rewardTypeLabels: Record<string, string> = {
    cashback: 'Cashback',
    voucher: 'Voucher',
    merchandise: 'Merchandise',
    benefit: 'Benefit',
    discount: 'Diskon',
  };

  const rewardTypeColors: Record<string, string> = {
    cashback: 'bg-emerald-100 text-emerald-700',
    voucher: 'bg-blue-100 text-blue-700',
    merchandise: 'bg-purple-100 text-purple-700',
    benefit: 'bg-amber-100 text-amber-700',
    discount: 'bg-red-100 text-red-700',
  };

  return (
    <Container className="py-4">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Katalog Reward</h1>
            <p className="mt-1 text-sm text-slate-600">
              Saldo Anda: <span className="font-semibold text-amber-600">{balance.toLocaleString('id-ID')} poin</span>
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              Semua
            </Button>
            {Object.entries(rewardTypeLabels).map(([type, label]) => (
              <Button
                key={type}
                variant={filterType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(type)}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Rewards Grid */}
          {catalogLoading ? (
            <LoadingState variant="skeleton" lines={6} />
          ) : rewards.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="Tidak ada reward tersedia"
              description="Reward akan muncul di sini saat tersedia"
              variant="minimal"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rewards.map((reward) => {
                const canAfford = balance >= reward.points_cost;
                const isOutOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;

                return (
                  <Card
                    key={reward.id}
                    className={`border-0 shadow-sm transition-all ${
                      !canAfford || isOutOfStock
                        ? 'opacity-60'
                        : 'hover:shadow-md active:scale-[0.99]'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Image */}
                        {reward.image_url ? (
                          <img
                            src={reward.image_url}
                            alt={reward.title}
                            className="h-20 w-20 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-100 flex-shrink-0">
                            <Gift className="h-8 w-8 text-slate-400" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    rewardTypeColors[reward.reward_type] || 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {rewardTypeLabels[reward.reward_type] || reward.reward_type}
                                </span>
                                {isOutOfStock && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                    Habis
                                  </span>
                                )}
                              </div>
                              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                                {reward.title}
                              </h3>
                              {reward.description && (
                                <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                                  {reward.description}
                                </p>
                              )}
                              {reward.cash_value && (
                                <p className="mt-2 text-sm font-semibold text-emerald-600">
                                  Nilai: Rp {reward.cash_value.toLocaleString('id-ID')}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Points Cost & Redeem Button */}
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Coins className="h-4 w-4 text-amber-600" />
                              <span className="text-lg font-bold text-slate-900">
                                {reward.points_cost.toLocaleString('id-ID')} poin
                              </span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleRedeem(reward)}
                              disabled={!canAfford || isOutOfStock || redeemMutation.isPending}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              {redeemMutation.isPending && selectedReward?.id === reward.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Memproses...
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="mr-2 h-4 w-4" />
                                  Tukar
                                </>
                              )}
                            </Button>
                          </div>

                          {!canAfford && (
                            <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Poin tidak cukup
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Redeem Confirmation Dialog */}
        <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tukar Reward</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menukar reward ini?
              </DialogDescription>
            </DialogHeader>
            {selectedReward && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selectedReward.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{selectedReward.description}</p>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <span className="text-sm text-slate-600">Poin yang digunakan:</span>
                  <span className="text-lg font-bold text-slate-900">
                    {selectedReward.points_cost.toLocaleString('id-ID')} poin
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <span className="text-sm text-slate-600">Saldo setelah penukaran:</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {(balance - selectedReward.points_cost).toLocaleString('id-ID')} poin
                  </span>
                </div>
                {selectedReward.terms_conditions && (
                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-900">Syarat & Ketentuan:</p>
                    <p className="mt-1 text-xs text-amber-700">{selectedReward.terms_conditions}</p>
                  </div>
                )}

                {/* Delivery Info Form for Merchandise */}
                {selectedReward.reward_type === 'merchandise' && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-slate-200">
                    <div>
                      <Label htmlFor="delivery-address" className="text-sm font-medium text-slate-700">
                        Alamat Pengiriman <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="delivery-address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Masukkan alamat lengkap untuk pengiriman"
                        required
                        className="mt-1.5"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="delivery-phone" className="text-sm font-medium text-slate-700">
                        Nomor Telepon <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="delivery-phone"
                        type="tel"
                        value={deliveryPhone}
                        onChange={(e) => setDeliveryPhone(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        required
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="delivery-notes" className="text-sm font-medium text-slate-700">
                        Catatan (Opsional)
                      </Label>
                      <Textarea
                        id="delivery-notes"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Catatan tambahan untuk kurir"
                        className="mt-1.5"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRedeemDialog(false)}
                disabled={redeemMutation.isPending}
              >
                Batal
              </Button>
              <Button
                onClick={confirmRedeem}
                disabled={
                  redeemMutation.isPending ||
                  (selectedReward?.reward_type === 'merchandise' && (!deliveryAddress.trim() || !deliveryPhone.trim()))
                }
                className="bg-amber-600 hover:bg-amber-700"
              >
                {redeemMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Konfirmasi'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </Container>
  );
}

