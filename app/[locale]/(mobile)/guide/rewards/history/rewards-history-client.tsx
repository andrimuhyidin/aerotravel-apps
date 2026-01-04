/**
 * Rewards History Client Component
 * Display redemption history
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Gift, XCircle } from 'lucide-react';
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
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Container } from '@/components/layout/container';
import queryKeys from '@/lib/queries/query-keys';

type Redemption = {
  id: string;
  points_used: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  voucher_code: string | null;
  redeemed_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  guide_reward_catalog: {
    id: string;
    reward_type: string;
    title: string;
    description: string | null;
    image_url: string | null;
  } | null;
};

type RedemptionsData = {
  redemptions: Redemption[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};

type RewardsHistoryClientProps = {
  locale: string;
};

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  pending: {
    label: 'Menunggu',
    icon: Clock,
    color: 'text-amber-600',
  },
  processing: {
    label: 'Diproses',
    icon: Clock,
    color: 'text-blue-600',
  },
  completed: {
    label: 'Selesai',
    icon: CheckCircle,
    color: 'text-emerald-600',
  },
  cancelled: {
    label: 'Dibatalkan',
    icon: XCircle,
    color: 'text-slate-600',
  },
  failed: {
    label: 'Gagal',
    icon: XCircle,
    color: 'text-red-600',
  },
};

export function RewardsHistoryClient({ locale: _locale }: RewardsHistoryClientProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancelRedemptionId, setCancelRedemptionId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Fetch redemptions
  const { data: redemptionsData, isLoading } = useQuery<RedemptionsData>({
    queryKey: [...queryKeys.guide.rewardRedemptions(), statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'all'
        ? '/api/guide/rewards/redemptions'
        : `/api/guide/rewards/redemptions?status=${statusFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch redemptions');
      return res.json();
    },
  });

  const redemptions = redemptionsData?.redemptions ?? [];

  // Cancel redemption mutation
  const cancelMutation = useMutation({
    mutationFn: async (redemptionId: string) => {
      const res = await fetch(`/api/guide/rewards/redemptions/${redemptionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by user' }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to cancel redemption');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Penukaran berhasil dibatalkan', {
        description: 'Poin telah dikembalikan ke akun Anda',
      });
      setShowCancelDialog(false);
      setCancelRedemptionId(null);
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.rewardRedemptions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.rewardPoints() });
    },
    onError: (error: Error) => {
      toast.error('Gagal membatalkan penukaran', {
        description: error.message,
      });
    },
  });

  const handleCancelClick = (redemptionId: string) => {
    setCancelRedemptionId(redemptionId);
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    if (cancelRedemptionId) {
      cancelMutation.mutate(cancelRedemptionId);
    }
  };

  if (isLoading) {
    return (
      <Container className="py-4">
        <LoadingState variant="skeleton" lines={5} />
      </Container>
    );
  }

  return (
    <Container className="py-4">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Riwayat Penukaran</h1>
            <p className="mt-1 text-sm text-slate-600">
              Lihat semua penukaran reward yang pernah Anda lakukan
            </p>
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Semua
            </Button>
            {Object.entries(statusConfig).map(([status, config]) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {config.label}
              </Button>
            ))}
          </div>

          {/* Redemptions List */}
          {redemptions.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="Belum ada penukaran"
              description="Riwayat penukaran reward Anda akan muncul di sini"
              variant="minimal"
            />
          ) : (
            <div className="space-y-4">
              {redemptions
                .filter((redemption) => redemption && redemption.id)
                .map((redemption) => {
                  const status = statusConfig[redemption.status] || statusConfig.pending;
                  const StatusIcon = status?.icon || Clock;
                  const catalog = redemption.guide_reward_catalog;

                return (
                  <Card key={redemption.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Image */}
                        {catalog?.image_url ? (
                          <img
                            src={catalog.image_url}
                            alt={catalog.title}
                            className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 flex-shrink-0">
                            <Gift className="h-6 w-6 text-slate-400" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-slate-900">
                                {catalog?.title || 'Reward'}
                              </h3>
                              {catalog?.description && (
                                <p className="mt-1 text-sm text-slate-600 line-clamp-1">
                                  {catalog.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-slate-500">Poin:</span>
                                  <span className="text-sm font-semibold text-slate-900">
                                    {redemption.points_used.toLocaleString('id-ID')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <StatusIcon className={`h-4 w-4 ${status?.color || 'text-slate-600'}`} />
                                  <span className={`text-xs font-medium ${status?.color || 'text-slate-600'}`}>
                                    {status?.label || 'Unknown'}
                                  </span>
                                </div>
                              </div>
                              {redemption.voucher_code && (
                                <div className="mt-2 rounded-lg bg-blue-50 p-2">
                                  <p className="text-xs font-medium text-blue-900">Kode Voucher:</p>
                                  <p className="mt-1 text-sm font-mono font-semibold text-blue-700">
                                    {redemption.voucher_code}
                                  </p>
                                </div>
                              )}
                              <p className="mt-2 text-xs text-slate-500">
                                Ditukar pada{' '}
                                {redemption.redeemed_at
                                  ? (() => {
                                      try {
                                        return new Date(redemption.redeemed_at).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        });
                                      } catch {
                                        return 'Tanggal tidak valid';
                                      }
                                    })()
                                  : 'Tanggal tidak tersedia'}
                              </p>
                              {redemption.completed_at && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Selesai pada{' '}
                                  {(() => {
                                    try {
                                      return new Date(redemption.completed_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      });
                                    } catch {
                                      return 'Tanggal tidak valid';
                                    }
                                  })()}
                                </p>
                              )}

                              {/* Cancel Button for Pending Redemptions */}
                              {redemption.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelClick(redemption.id)}
                                  disabled={cancelMutation.isPending}
                                  className="mt-3 text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Batal Penukaran
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Cancel Confirmation Dialog */}
          <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Batalkan Penukaran?</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin membatalkan penukaran ini? Poin akan dikembalikan ke akun Anda.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancelRedemptionId(null);
                  }}
                  disabled={cancelMutation.isPending}
                >
                  Tidak
                </Button>
                <Button
                  onClick={handleConfirmCancel}
                  disabled={cancelMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {cancelMutation.isPending ? 'Memproses...' : 'Ya, Batalkan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
    </Container>
  );
}

