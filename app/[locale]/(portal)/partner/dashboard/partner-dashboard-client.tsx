'use client';

/**
 * Partner Dashboard Client Component
 * Menampilkan wallet balance, recent bookings, quick actions
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMitraBookings, type MitraBooking } from '@/lib/partner/booking';
import { formatCurrency, getWalletBalance, getWalletTransactions, type WalletBalance, type WalletTransaction } from '@/lib/partner/wallet';
import { cn } from '@/lib/utils';
import {
    ArrowDownRight,
    ArrowUpRight,
    CreditCard,
    FileText,
    Loader2,
    Package,
    Plus,
    RefreshCw,
    Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function PartnerDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [recentBookings, setRecentBookings] = useState<MitraBooking[]>([]);

  // TODO: Get from auth context
  const partnerId = 'demo-partner-id';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    const [balance, txs, bookings] = await Promise.all([
      getWalletBalance(partnerId),
      getWalletTransactions(partnerId, 5),
      getMitraBookings(partnerId, 5),
    ]);
    setWalletBalance(balance);
    setTransactions(txs);
    setRecentBookings(bookings);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partner Dashboard</h1>
          <p className="text-muted-foreground">Kelola booking dan deposit Anda</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDashboardData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Wallet Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5" />
            Saldo Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {walletBalance ? formatCurrency(walletBalance.balance) : 'Rp 0'}
          </div>
          {walletBalance && walletBalance.creditLimit > 0 && (
            <div className="text-sm opacity-80 mt-1">
              Credit Limit: {formatCurrency(walletBalance.creditLimit)}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" size="sm" asChild>
              <Link href="/partner/wallet">
                <Plus className="h-4 w-4 mr-2" />
                Top-up
              </Link>
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/partner/wallet">
                <FileText className="h-4 w-4 mr-2" />
                Riwayat
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/partner/whitelabel">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="py-6 flex flex-col items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              <span className="font-medium">Lihat Paket</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/partner/bookings">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="py-6 flex flex-col items-center gap-2">
              <CreditCard className="h-8 w-8 text-primary" />
              <span className="font-medium">Buat Booking</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Transaksi Terakhir</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/partner/wallet">Lihat Semua</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Belum ada transaksi
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-full',
                      tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    )}
                  >
                    {tx.amount > 0 ? (
                      <ArrowDownRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {tx.description || tx.type}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'font-medium',
                      tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {tx.amount > 0 ? '+' : ''}
                    {formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Booking Terakhir</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/partner/bookings">Lihat Semua</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Belum ada booking
            </p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/partner/bookings/${booking.id}`}
                  className="block"
                >
                  <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {booking.packageName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {booking.bookingCode} • {booking.customerName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        +{formatCurrency(booking.margin)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Margin
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
