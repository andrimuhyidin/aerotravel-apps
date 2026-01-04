/**
 * Partner Wallet Transactions Client Component
 * Displays transaction history with filtering and export
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import {
  ArrowLeft,
  Download,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Transaction = {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number | null;
  balanceAfter: number | null;
  description: string;
  status: string;
  bookingCode: string | null;
  bookingCustomerName: string | null;
  createdAt: string;
  completedAt: string | null;
};

type TransactionsResponse = {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function TransactionsClient({ locale }: { locale: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadTransactions();
  }, [typeFilter, dateFrom, dateTo, searchQuery, pagination.page]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (dateFrom) {
        params.append('from', dateFrom);
      }
      if (dateTo) {
        params.append('to', dateTo);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(
        `/api/partner/wallet/transactions?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to load transactions');
      }

      const data = (await response.json()) as TransactionsResponse;
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (error) {
      logger.error('Failed to load transactions', error, {
        typeFilter,
        dateFrom,
        dateTo,
      });
      
      toast.error(
        error instanceof Error
          ? error.message
          : 'Gagal memuat riwayat transaksi. Silakan refresh halaman.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams({
      export: 'csv',
    });

    if (typeFilter !== 'all') {
      params.append('type', typeFilter);
    }
    if (dateFrom) {
      params.append('from', dateFrom);
    }
    if (dateTo) {
      params.append('to', dateTo);
    }
    if (searchQuery) {
      params.append('search', searchQuery);
    }

    window.open(`/api/partner/wallet/transactions?${params.toString()}`, '_blank');
  };

  const getTransactionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      topup: 'Top-up',
      topup_pending: 'Top-up (Pending)',
      booking_debit: 'Debit Booking',
      refund: 'Refund',
      adjustment: 'Penyesuaian',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/${locale}/partner/wallet`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Wallet
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold break-words">Riwayat Transaksi</h1>
          <p className="text-muted-foreground">
            Lihat semua transaksi wallet Anda
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipe Transaksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="topup">Top-up</SelectItem>
                <SelectItem value="booking_debit">Debit Booking</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="adjustment">Penyesuaian</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Dari Tanggal"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />

            <Input
              type="date"
              placeholder="Sampai Tanggal"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Memuat transaksi...</p>
          </CardContent>
        </Card>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Tidak ada transaksi ditemukan</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {transactions.map((tx) => {
              const isCredit = tx.amount > 0;
              const isPending = tx.status === 'pending';

              return (
                <Card key={tx.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isCredit ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-semibold">
                            {getTransactionTypeLabel(tx.type)}
                          </span>
                          {isPending && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                              Pending
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {tx.description}
                        </p>

                        {tx.bookingCode && (
                          <p className="text-xs text-muted-foreground">
                            Booking: {tx.bookingCode}
                            {tx.bookingCustomerName && ` - ${tx.bookingCustomerName}`}
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(tx.createdAt)}
                        </p>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${
                            isCredit ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isCredit ? '+' : '-'}
                          {formatCurrency(Math.abs(tx.amount))}
                        </div>

                        {tx.balanceAfter !== null && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Saldo: {formatCurrency(tx.balanceAfter)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
              >
                Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">
                Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} total)
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

