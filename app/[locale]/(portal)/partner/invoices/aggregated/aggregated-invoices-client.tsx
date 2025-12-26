/**
 * Partner Aggregated Invoices Client Component
 * Generate and download aggregated invoices for weekly/monthly periods
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
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
  Calendar,
  Download,
  FileText,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DateRangePicker } from '@/components/ui/date-range-picker';

type AggregatedInvoiceData = {
  period: 'weekly' | 'monthly';
  periodStart: string;
  periodEnd: string;
  totalBookings: number;
  subtotal: number;
  total: number;
  bookings: Array<{
    bookingCode: string;
    tripDate: string;
    customerName: string;
    packageName: string | null;
    packageDestination: string | null;
    totalAmount: number;
    status: string;
  }>;
};

export function AggregatedInvoicesClient({ locale }: { locale: string }) {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [data, setData] = useState<AggregatedInvoiceData | null>(null);
  const [downloading, setDownloading] = useState(false);

  const loadAggregatedInvoice = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period,
      });

      if (dateFrom && dateTo) {
        params.append('from', dateFrom.toISOString().split('T')[0]!);
        params.append('to', dateTo.toISOString().split('T')[0]!);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/partner/invoices/aggregated?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load aggregated invoice');
      }

      const invoiceData = (await response.json()) as AggregatedInvoiceData;
      setData(invoiceData);
    } catch (error) {
      logger.error('Failed to load aggregated invoice', error);
      toast.error('Gagal memuat invoice agregat. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!data) return;

    try {
      setDownloading(true);
      // Generate invoice number
      const invoiceNumber = `INV-AGG-${period.toUpperCase()}-${data.periodStart.replace(/-/g, '')}`;
      const invoiceDate = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Get partner whitelabel settings
      const whitelabelResponse = await fetch('/api/partner/profile');
      let companyName = 'Partner';
      let companyAddress = '';
      let companyPhone = '';
      let companyEmail = '';
      let footerText = '';

      if (whitelabelResponse.ok) {
        const profile = await whitelabelResponse.json();
        const whitelabel = profile.whitelabel?.[0];
        companyName = whitelabel?.company_name || profile.company_name || 'Partner';
        companyAddress = whitelabel?.company_address || '';
        companyPhone = whitelabel?.company_phone || '';
        companyEmail = whitelabel?.company_email || '';
        footerText = whitelabel?.invoice_footer || '';
      }

      // Prepare invoice data
      const invoiceData = {
        invoiceNumber,
        invoiceDate,
        period,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        companyName,
        companyAddress,
        companyPhone,
        companyEmail,
        bookings: data.bookings,
        subtotal: data.subtotal,
        total: data.total,
        totalBookings: data.totalBookings,
        footerText,
      };

      // Generate PDF
      const response = await fetch('/api/partner/invoices/aggregated/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-agregat-${period}-${data.periodStart}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Invoice agregat berhasil diunduh!');
    } catch (error) {
      logger.error('Failed to download aggregated invoice', error);
      toast.error('Gagal mengunduh invoice agregat. Silakan coba lagi.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Invoice Agregat</h1>
        <p className="text-muted-foreground">
          Generate invoice agregat untuk periode mingguan atau bulanan
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter & Periode</CardTitle>
          <CardDescription>Pilih periode dan filter untuk generate invoice agregat</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Periode</label>
              <Select value={period} onValueChange={(value) => setPeriod(value as 'weekly' | 'monthly')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Rentang Tanggal (Opsional)</label>
              <DateRangePicker
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onClear={() => {
                  setDateFrom(null);
                  setDateTo(null);
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status Booking</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="paid">Sudah Dibayar</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={loadAggregatedInvoice} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memuat...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Invoice Agregat
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoice Agregat</CardTitle>
                <CardDescription>
                  Periode: {data.periodStart} s/d {data.periodEnd}
                </CardDescription>
              </div>
              <Button onClick={handleDownloadPDF} disabled={downloading}>
                {downloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengunduh...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Unduh PDF
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total Booking</div>
                <div className="text-2xl font-bold">{data.totalBookings}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Subtotal</div>
                <div className="text-2xl font-bold">{formatCurrency(data.subtotal)}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total</div>
                <div className="text-2xl font-bold text-primary">{formatCurrency(data.total)}</div>
              </div>
            </div>

            {data.bookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Kode Booking</th>
                      <th className="text-left p-2">Tanggal Trip</th>
                      <th className="text-left p-2">Customer</th>
                      <th className="text-left p-2">Paket</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-right p-2">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bookings.map((booking) => (
                      <tr key={booking.bookingCode} className="border-b">
                        <td className="p-2">{booking.bookingCode}</td>
                        <td className="p-2">{booking.tripDate}</td>
                        <td className="p-2">{booking.customerName}</td>
                        <td className="p-2">
                          {booking.packageName || '-'}
                          {booking.packageDestination && ` - ${booking.packageDestination}`}
                        </td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              booking.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="p-2 text-right">{formatCurrency(booking.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="Tidak ada booking"
                description="Tidak ada booking untuk periode yang dipilih."
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

