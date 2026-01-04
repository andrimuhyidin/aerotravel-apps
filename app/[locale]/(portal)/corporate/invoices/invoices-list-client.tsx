/**
 * Invoices List Client Component
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  CheckCircle,
  Clock,
  Download,
  FileText,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';

type Invoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  paidAt: string | null;
};

type InvoicesResponse = {
  invoices: Invoice[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

type InvoicesListClientProps = {
  locale: string;
};

export function InvoicesListClient({ locale }: InvoicesListClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data, isLoading, isFetching } = useQuery<InvoicesResponse>({
    queryKey: ['corporate', 'invoices', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await apiClient.get(
        `/api/partner/corporate/invoices?${params}`
      );
      return response.data as InvoicesResponse;
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Lunas
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Menunggu
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Invoice</h1>
          <p className="text-sm text-muted-foreground">
            {data?.pagination.total || 0} invoice
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 border rounded-md text-sm bg-background"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Menunggu Bayar</option>
          <option value="paid">Lunas</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Invoice List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !data?.invoices.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium mb-1">Belum ada invoice</p>
            <p className="text-sm text-muted-foreground">
              Invoice akan muncul setelah ada booking
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.invoices.map((invoice) => (
            <Card key={invoice.id} className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>
                          Tanggal:{' '}
                          {format(new Date(invoice.invoiceDate), 'd MMM yyyy', {
                            locale: id,
                          })}
                        </span>
                        <span>
                          Jatuh Tempo:{' '}
                          {format(new Date(invoice.dueDate), 'd MMM yyyy', {
                            locale: id,
                          })}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(invoice.totalAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Termasuk PPN: {formatCurrency(invoice.taxAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {data.pagination.total > limit && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isFetching}
              >
                Sebelumnya
              </Button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                Halaman {page + 1} dari{' '}
                {Math.ceil(data.pagination.total / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.pagination.hasMore || isFetching}
              >
                {isFetching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Selanjutnya
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

