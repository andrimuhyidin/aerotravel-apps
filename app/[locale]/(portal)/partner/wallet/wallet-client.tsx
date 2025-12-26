/**
 * Partner Wallet Client Component
 * REDESIGNED - Clean, Big Numbers, Progress Bar, Simple Actions
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader, StatusBadge } from '@/components/partner';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  Download,
  History,
  Plus,
  TrendingUp,
  Wallet as WalletIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type WalletBalance = {
  balance: number;
  creditLimit: number;
  creditUsed: number;
  availableBalance: number;
};

type Transaction = {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  bookingCode?: string | null;
};

export function WalletClient({ locale }: { locale: string }) {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        fetch('/api/partner/wallet/balance'),
        fetch('/api/partner/wallet/transactions?limit=10'),
      ]);

      if (!balanceRes.ok || !transactionsRes.ok) {
        throw new Error('Failed to load wallet data');
      }

      const balanceData = (await balanceRes.json()) as WalletBalance;
      const transactionsData = (await transactionsRes.json()) as { transactions: Transaction[] };

      setBalance(balanceData);
      setTransactions(transactionsData.transactions);
    } catch (error) {
      logger.error('Failed to load wallet', error);
      toast.error('Gagal memuat data wallet');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <WalletSkeleton />;
  }

  if (!balance) {
    return (
      <div className="p-6">
        <EmptyState
          icon={WalletIcon}
          title="Wallet tidak tersedia"
          description="Terjadi kesalahan saat memuat wallet Anda"
        />
      </div>
    );
  }

  const creditPercentage = balance.creditLimit > 0
    ? (balance.creditUsed / balance.creditLimit) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Wallet & Saldo"
        description="Kelola saldo dan transaksi Anda"
      />

      {/* Content */}
      <div className="space-y-6 px-4 pb-20">
        {/* Balance Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-blue-50">
          <CardContent className="space-y-6 p-6">
            {/* Current Balance */}
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Saldo Saat Ini</p>
              <p className="mt-2 text-4xl font-bold text-foreground">
                {formatCurrency(balance.balance)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                + Credit: {formatCurrency(balance.availableBalance - balance.balance)}
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" className="w-full">
                <Plus className="mr-2 h-5 w-5" />
                Top Up
              </Button>
              <Button size="lg" variant="outline" className="w-full">
                <ArrowDown className="mr-2 h-5 w-5" />
                Tarik Saldo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Credit Limit Card */}
        {balance.creditLimit > 0 && (
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Credit Limit</h3>
                <span className="text-sm text-muted-foreground">
                  {creditPercentage.toFixed(0)}% digunakan
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full transition-all',
                      creditPercentage < 50
                        ? 'bg-green-500'
                        : creditPercentage < 80
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    )}
                    style={{ width: `${creditPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tersedia: {formatCurrency(balance.creditLimit - balance.creditUsed)}
                  </span>
                  <span className="font-semibold text-foreground">
                    dari {formatCurrency(balance.creditLimit)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Transaksi Terbaru</h3>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/${locale}/partner/wallet/transactions`}>
                  Lihat Semua
                </Link>
              </Button>
            </div>

            {transactions.length === 0 ? (
              <EmptyState
                variant="minimal"
                icon={History}
                title="Belum ada transaksi"
                description="Transaksi Anda akan muncul di sini"
              />
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Transaction Item Component
function TransactionItem({ transaction }: { transaction: Transaction }) {
  const isCredit = transaction.type === 'topup' || transaction.type === 'refund';
  const isDebit = transaction.type === 'booking' || transaction.type === 'withdrawal';

  return (
    <div className="flex items-center justify-between rounded-lg border bg-white p-3 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            isCredit && 'bg-green-100',
            isDebit && 'bg-red-100'
          )}
        >
          {isCredit && <ArrowUp className="h-5 w-5 text-green-600" />}
          {isDebit && <ArrowDown className="h-5 w-5 text-red-600" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {transaction.description}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(transaction.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
      <p
        className={cn(
          'text-base font-bold',
          isCredit && 'text-green-600',
          isDebit && 'text-red-600'
        )}
      >
        {isCredit ? '+' : '-'}
        {formatCurrency(Math.abs(transaction.amount))}
      </p>
    </div>
  );
}

// Loading Skeleton
function WalletSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
