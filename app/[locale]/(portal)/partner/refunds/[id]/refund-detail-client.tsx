/**
 * Partner Refund Detail Client Component
 * Detailed view of a single refund
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
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

type Refund = {
  id: string;
  bookingId: string;
  bookingCode: string | null;
  tripDate: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  packageName: string | null;
  packageDestination: string | null;
  originalAmount: number;
  refundPercent: number;
  adminFee: number;
  refundAmount: number;
  daysBeforeTrip: number;
  policyApplied: string | null;
  status: string;
  refundTo: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  isOverride: boolean;
  overrideReason: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  processedAt: string | null;
  completedAt: string | null;
  disbursementId: string | null;
  requestedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export function RefundDetailClient({
  locale,
  refundId,
}: {
  locale: string;
  refundId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refund, setRefund] = useState<Refund | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPolicy, setDownloadingPolicy] = useState(false);
  const [documentLanguage, setDocumentLanguage] = useState<'id' | 'en'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('partner_document_language');
      return (saved === 'en' ? 'en' : 'id') as 'id' | 'en';
    }
    return 'id';
  });

  useEffect(() => {
    loadRefund();
  }, [refundId]);

  const loadRefund = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/partner/refunds/${refundId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Refund tidak ditemukan');
        } else {
          throw new Error('Failed to load refund');
        }
        return;
      }

      const data = (await response.json()) as { refund: Refund };
      setRefund(data.refund);
    } catch (error) {
      logger.error('Failed to load refund', error);
      toast.error('Gagal memuat detail refund. Silakan refresh halaman.');
      setError('Gagal memuat detail refund');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string; icon: typeof CheckCircle2 }> = {
      pending: { label: 'Pending', variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      approved: { label: 'Disetujui', variant: 'default', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
      processing: { label: 'Diproses', variant: 'default', icon: Loader2 },
      completed: { label: 'Selesai', variant: 'default', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
      rejected: { label: 'Ditolak', variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' as const, icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className ? `${config.className} text-base px-3 py-1` : 'text-base px-3 py-1'}>
        <Icon className="h-4 w-4 mr-2" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadRefundPolicy = async () => {
    if (!refund || !refund.bookingId) return;

    try {
      setDownloadingPolicy(true);

      // Save language preference
      if (typeof window !== 'undefined') {
        localStorage.setItem('partner_document_language', documentLanguage);
      }

      const response = await fetch(
        `/api/partner/bookings/${refund.bookingId}/documents/refund-policy?language=${documentLanguage}`
      );

      if (!response.ok) {
        throw new Error('Failed to download refund policy');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `refund-policy-${refund.bookingCode || refund.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Refund policy berhasil diunduh');
    } catch (error) {
      logger.error('Failed to download refund policy', error, { refundId: refund.id });
      
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Gagal mengunduh refund policy. Silakan coba lagi atau hubungi support.';
      
      toast.error(errorMessage);
    } finally {
      setDownloadingPolicy(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !refund) {
    return (
      <div className="container mx-auto py-8">
        <EmptyState
          icon={AlertCircle}
          title="Gagal Memuat Detail Refund"
          description={error || 'Refund tidak ditemukan atau terjadi kesalahan.'}
          action={
            <Button onClick={() => router.push(`/${locale}/partner/refunds`)}>
              Kembali ke Daftar Refund
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href={`/${locale}/partner/refunds`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Refund
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Detail Refund</h1>
            <p className="text-muted-foreground">
              Kode Booking: {refund.bookingCode || '-'}
            </p>
          </div>
          {getStatusBadge(refund.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Refund Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Refund</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Jumlah Asli</div>
              <div className="text-lg font-semibold">{formatCurrency(refund.originalAmount)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Persentase Refund</div>
              <div className="text-lg font-semibold">{refund.refundPercent}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Biaya Admin</div>
              <div className="text-lg font-semibold">{formatCurrency(refund.adminFee)}</div>
            </div>
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground mb-1">Jumlah Refund</div>
              <div className="text-2xl font-bold text-primary">{formatCurrency(refund.refundAmount)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Kebijakan yang Diterapkan</div>
              <div className="text-sm mb-2">{refund.policyApplied || '-'}</div>
              {refund.bookingId && (
                <Button
                  onClick={handleDownloadRefundPolicy}
                  disabled={downloadingPolicy}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {downloadingPolicy ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengunduh...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Unduh Refund Policy
                    </>
                  )}
                </Button>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Hari Sebelum Trip</div>
              <div className="text-sm">{refund.daysBeforeTrip} hari</div>
            </div>
            {refund.isOverride && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-sm font-semibold text-yellow-800 mb-1">Override</div>
                <div className="text-sm text-yellow-700">{refund.overrideReason || '-'}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Kode Booking</div>
              <div className="font-medium">{refund.bookingCode || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Tanggal Trip</div>
              <div className="font-medium">{refund.tripDate ? formatDate(refund.tripDate) : '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Paket</div>
              <div className="font-medium">
                {refund.packageName || '-'}
                {refund.packageDestination && ` - ${refund.packageDestination}`}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Customer</div>
              <div className="font-medium">{refund.customerName || '-'}</div>
              {refund.customerPhone && (
                <div className="text-sm text-muted-foreground">{refund.customerPhone}</div>
              )}
              {refund.customerEmail && (
                <div className="text-sm text-muted-foreground">{refund.customerEmail}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Refund Destination */}
        <Card>
          <CardHeader>
            <CardTitle>Tujuan Refund</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Tujuan</div>
              <div className="font-medium capitalize">{refund.refundTo || 'wallet'}</div>
            </div>
            {refund.refundTo === 'bank' && (
              <>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Nama Bank</div>
                  <div className="font-medium">{refund.bankName || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Nomor Rekening</div>
                  <div className="font-medium">{refund.bankAccountNumber || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Nama Pemilik Rekening</div>
                  <div className="font-medium">{refund.bankAccountName || '-'}</div>
                </div>
              </>
            )}
            {refund.disbursementId && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Disbursement ID</div>
                <div className="font-medium font-mono text-sm">{refund.disbursementId}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Status Saat Ini</div>
              <div>{getStatusBadge(refund.status)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Dibuat</div>
              <div className="text-sm">{formatDate(refund.createdAt)}</div>
            </div>
            {refund.approvedAt && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Disetujui</div>
                <div className="text-sm">{formatDate(refund.approvedAt)}</div>
              </div>
            )}
            {refund.processedAt && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Diproses</div>
                <div className="text-sm">{formatDate(refund.processedAt)}</div>
              </div>
            )}
            {refund.completedAt && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Selesai</div>
                <div className="text-sm">{formatDate(refund.completedAt)}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground mb-1">Terakhir Diupdate</div>
              <div className="text-sm">{formatDate(refund.updatedAt)}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

