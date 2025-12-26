/**
 * Partner Invoice Detail Client Component
 * REDESIGNED - Clean layout, Payment info, Download button
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, InfoCard, StatusBadge } from '@/components/partner';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { ArrowLeft, Download, CreditCard, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  bookingCode: string;
  amount: number;
  tax: number;
  total: number;
  status: 'unpaid' | 'paid' | 'overdue';
  dueDate: string;
  paidDate: string | null;
  createdAt: string;
  booking: {
    id: string;
    packageName: string;
    tripDate: string;
    customerName: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
};

export function InvoiceDetailClient({ invoiceId, locale }: { invoiceId: string; locale: string }) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/invoices/${invoiceId}`);
      if (!res.ok) throw new Error('Failed to fetch invoice');
      const data = (await res.json()) as InvoiceDetail;
      setInvoice(data);
    } catch (error) {
      logger.error('Failed to load invoice', error);
      toast.error('Gagal memuat invoice');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <InvoiceDetailSkeleton />;
  }

  if (!invoice) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Invoice tidak ditemukan</p>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid';

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={invoice.invoiceNumber}
        description="Detail invoice pembayaran"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${locale}/partner/invoices`}>
                <ArrowLeft className="mr-1 h-3 w-3" />
                Kembali
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-1 h-3 w-3" />
              Download
            </Button>
          </div>
        }
      />

      <div className="space-y-4 px-4 pb-20">
        {/* Status Card */}
        <Card className={isPaid ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status Pembayaran</p>
              <div className="mt-1">
                <StatusBadge status={invoice.status} variant="pill" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(invoice.total)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Info */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="font-semibold text-foreground">Informasi Invoice</h3>
            <InfoCard
              label="Booking Code"
              value={invoice.bookingCode}
              icon={FileText}
              orientation="horizontal"
            />
            <InfoCard
              label="Package"
              value={invoice.booking.packageName}
              orientation="horizontal"
            />
            <InfoCard label="Customer" value={invoice.booking.customerName} orientation="horizontal" />
            <InfoCard
              label="Tanggal Invoice"
              value={new Date(invoice.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              icon={Calendar}
              orientation="horizontal"
            />
            <InfoCard
              label="Due Date"
              value={new Date(invoice.dueDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              icon={Calendar}
              orientation="horizontal"
            />
            {isPaid && invoice.paidDate && (
              <InfoCard
                label="Tanggal Bayar"
                value={new Date(invoice.paidDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                icon={Calendar}
                orientation="horizontal"
              />
            )}
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="font-semibold text-foreground">Detail Pembayaran</h3>
            {invoice.items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-4 border-b pb-2 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(item.total)}</p>
              </div>
            ))}

            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(invoice.amount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pajak</span>
                <span className="font-medium text-foreground">{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Action */}
        {!isPaid && (
          <Button className="w-full" size="lg">
            <CreditCard className="mr-2 h-4 w-4" />
            Bayar Sekarang
          </Button>
        )}
      </div>
    </div>
  );
}

function InvoiceDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-4 p-4">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

