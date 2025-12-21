/**
 * Rewards Dashboard Client Component
 * Display reward points balance, summary, and recent transactions
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Coins, Gift, History, TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Container } from '@/components/layout/container';
import queryKeys from '@/lib/queries/query-keys';

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

type RewardTransaction = {
  id: string;
  transaction_type: 'earn' | 'redeem' | 'expire' | 'adjustment' | 'refund';
  points: number;
  source_type: string;
  description: string | null;
  created_at: string;
  expires_at: string | null;
};

type RewardTransactionsData = {
  transactions: RewardTransaction[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};

type RewardsDashboardClientProps = {
  locale: string;
};

export function RewardsDashboardClient({ locale }: RewardsDashboardClientProps) {
  // Fetch points balance
  const { data: pointsData, isLoading: pointsLoading } = useQuery<RewardPointsData>({
    queryKey: queryKeys.guide.rewardPoints(),
    queryFn: async () => {
      const res = await fetch('/api/guide/rewards/points');
      if (!res.ok) throw new Error('Failed to fetch reward points');
      return res.json();
    },
  });

  // Fetch recent transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery<RewardTransactionsData>({
    queryKey: [...queryKeys.guide.rewardTransactions(), 'recent'],
    queryFn: async () => {
      const res = await fetch('/api/guide/rewards/transactions?limit=10&offset=0');
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
  });

  if (pointsLoading || transactionsLoading) {
    return (
      <Container className="py-4">
        <LoadingState variant="skeleton" lines={5} />
      </Container>
    );
  }

  const balance = pointsData?.balance || 0;
  const lifetimeEarned = pointsData?.lifetimeEarned || 0;
  const lifetimeRedeemed = pointsData?.lifetimeRedeemed || 0;
  const expiringSoon = pointsData?.expiringSoon?.total || 0;
  const transactions = transactionsData?.transactions || [];

  return (
    <Container className="py-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Reward Points</h1>
              <p className="mt-1 text-sm text-slate-600">
                Kumpulkan poin dan tukar dengan reward menarik
              </p>
            </div>
            <Link href={`/${locale}/guide/rewards/catalog`}>
              <Button variant="outline" size="sm">
                <Gift className="mr-2 h-4 w-4" />
                Katalog
              </Button>
            </Link>
          </div>

          {/* Points Balance Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-100">Saldo Poin Anda</p>
                  <p className="mt-2 text-4xl font-bold text-white">
                    {balance.toLocaleString('id-ID')}
                  </p>
                  <p className="mt-1 text-sm text-amber-100">poin</p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <Coins className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expiring Points Warning */}
          {expiringSoon > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">
                      Poin Akan Kadaluarsa
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                      Anda memiliki {expiringSoon.toLocaleString('id-ID')} poin yang akan
                      kadaluarsa dalam 30 hari. Tukar sekarang!
                    </p>
                    <Link href={`/${locale}/guide/rewards/catalog`}>
                      <Button variant="outline" size="sm" className="mt-3 border-red-300 text-red-700 hover:bg-red-100">
                        Lihat Katalog
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs font-medium text-slate-600">Total Diperoleh</p>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {lifetimeEarned.toLocaleString('id-ID')}
                </p>
                <p className="mt-1 text-xs text-slate-500">sepanjang waktu</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-amber-600" />
                  <p className="text-xs font-medium text-slate-600">Total Ditukar</p>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {lifetimeRedeemed.toLocaleString('id-ID')}
                </p>
                <p className="mt-1 text-xs text-slate-500">sepanjang waktu</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold">Riwayat Transaksi</CardTitle>
              <Link href={`/${locale}/guide/rewards/history`}>
                <Button variant="ghost" size="sm">
                  <History className="mr-2 h-4 w-4" />
                  Lihat Semua
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="Belum ada transaksi"
                  description="Transaksi poin Anda akan muncul di sini"
                  variant="minimal"
                />
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {transaction.description || 'Transaksi poin'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(transaction.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${
                            transaction.transaction_type === 'earn' ||
                            transaction.transaction_type === 'refund'
                              ? 'text-emerald-600'
                              : transaction.transaction_type === 'expire'
                                ? 'text-red-600'
                                : 'text-slate-600'
                          }`}
                        >
                          {transaction.transaction_type === 'earn' ||
                          transaction.transaction_type === 'refund'
                            ? '+'
                            : transaction.transaction_type === 'expire'
                              ? '-'
                              : '-'}
                          {Math.abs(transaction.points).toLocaleString('id-ID')}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">poin</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Link href={`/${locale}/guide/rewards/catalog`}>
              <Card className="border-0 shadow-sm transition-all hover:shadow-md active:scale-[0.98] cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                      <Gift className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Katalog Reward</p>
                      <p className="mt-1 text-xs text-slate-500">Tukar poin Anda</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/${locale}/guide/rewards/history`}>
              <Card className="border-0 shadow-sm transition-all hover:shadow-md active:scale-[0.98] cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <History className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Riwayat</p>
                      <p className="mt-1 text-xs text-slate-500">Lihat semua transaksi</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
    </Container>
  );
}

