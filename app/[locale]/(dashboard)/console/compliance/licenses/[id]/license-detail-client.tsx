'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Pencil,
  RefreshCw,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';

type LicenseDetail = {
  id: string;
  licenseType: string;
  licenseNumber: string;
  licenseName: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string | null;
  status: string;
  documentUrl: string | null;
  notes: string | null;
  daysUntilExpiry: number | null;
  remindersSent: {
    days30: boolean;
    days15: boolean;
    days7: boolean;
    days1: boolean;
  };
  asitaDetails: {
    id: string;
    nia: string;
    membershipType: string;
    dpdRegion: string | null;
    memberSince: string;
  } | null;
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    isRead: boolean;
    isResolved: boolean;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email: string } | null;
  updatedBy: { id: string; name: string; email: string } | null;
};

async function fetchLicenseDetail(id: string): Promise<LicenseDetail> {
  const response = await fetch(`/api/admin/compliance/licenses/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Izin tidak ditemukan');
    }
    throw new Error('Gagal memuat detail izin');
  }
  return response.json();
}

const licenseTypeLabels: Record<string, string> = {
  nib: 'Nomor Induk Berusaha (NIB)',
  skdn: 'Surat Keterangan Domisili Niaga (SKDN)',
  sisupar: 'Sistem Informasi Usaha Pariwisata (SISUPAR)',
  tdup: 'Tanda Daftar Usaha Pariwisata (TDUP)',
  asita: 'Keanggotaan ASITA',
  chse: 'Sertifikasi CHSE',
};

const statusLabels: Record<string, string> = {
  valid: 'Valid',
  warning: 'Warning (30 hari)',
  critical: 'Critical (7 hari)',
  expired: 'Expired',
  suspended: 'Suspended',
};

const statusColors: Record<string, string> = {
  valid: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-gray-100 text-gray-800 border-gray-200',
  suspended: 'bg-purple-100 text-purple-800 border-purple-200',
};

const severityIcons: Record<string, React.ReactNode> = {
  info: <Bell className="h-4 w-4 text-blue-500" />,
  warning: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  critical: <AlertTriangle className="h-4 w-4 text-red-500" />,
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      {icon && <div className="text-muted-foreground mt-0.5">{icon}</div>}
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value || '-'}</p>
      </div>
    </div>
  );
}

export function LicenseDetailClient() {
  const params = useParams();
  const id = params.id as string;

  const { data: license, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.admin.compliance.license(id),
    queryFn: () => fetchLicenseDetail(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !license) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/console/compliance/licenses">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Detail Izin</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-3" />
              <p className="text-destructive font-medium">
                {error instanceof Error ? error.message : 'Gagal memuat detail izin'}
              </p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/console/compliance/licenses">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{license.licenseName}</h1>
              <Badge className={statusColors[license.status]}>
                {statusLabels[license.status] || license.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {licenseTypeLabels[license.licenseType] || license.licenseType.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link href={`/console/compliance/licenses/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {(license.status === 'expired' || license.status === 'critical') && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
              <div>
                <p className="font-medium text-destructive">
                  {license.status === 'expired'
                    ? 'Izin ini telah EXPIRED!'
                    : `Izin akan expired dalam ${license.daysUntilExpiry} hari!`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Segera lakukan perpanjangan untuk menghindari operasional ilegal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informasi Izin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoRow
                label="Nomor Izin"
                value={<span className="font-mono">{license.licenseNumber}</span>}
                icon={<FileText className="h-4 w-4" />}
              />
              <InfoRow
                label="Jenis Izin"
                value={licenseTypeLabels[license.licenseType] || license.licenseType.toUpperCase()}
              />
              <InfoRow
                label="Penerbit"
                value={license.issuedBy}
              />
              <InfoRow
                label="Tanggal Terbit"
                value={formatDate(license.issuedDate)}
                icon={<Calendar className="h-4 w-4" />}
              />
              <InfoRow
                label="Tanggal Expired"
                value={
                  <div>
                    <span>{formatDate(license.expiryDate)}</span>
                    {license.daysUntilExpiry !== null && license.status !== 'expired' && (
                      <span className={`ml-2 text-sm ${
                        license.daysUntilExpiry <= 7 ? 'text-red-600' : 
                        license.daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-muted-foreground'
                      }`}>
                        ({license.daysUntilExpiry} hari lagi)
                      </span>
                    )}
                  </div>
                }
                icon={<Clock className="h-4 w-4" />}
              />
              <InfoRow
                label="Status"
                value={
                  <Badge className={statusColors[license.status]}>
                    {statusLabels[license.status] || license.status}
                  </Badge>
                }
              />
            </div>

            {license.notes && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Catatan</p>
                  <p className="whitespace-pre-wrap">{license.notes}</p>
                </div>
              </>
            )}

            {license.documentUrl && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Dokumen</p>
                  <Button variant="outline" asChild>
                    <a href={license.documentUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download Dokumen
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* ASITA Details */}
          {license.licenseType === 'asita' && license.asitaDetails && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Award className="h-5 w-5" />
                  Detail ASITA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">NIA</p>
                  <p className="font-mono font-medium">{license.asitaDetails.nia}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipe Keanggotaan</p>
                  <p className="font-medium capitalize">{license.asitaDetails.membershipType}</p>
                </div>
                {license.asitaDetails.dpdRegion && (
                  <div>
                    <p className="text-sm text-muted-foreground">DPD ASITA</p>
                    <p className="font-medium">{license.asitaDetails.dpdRegion}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Anggota Sejak</p>
                  <p className="font-medium">{formatDate(license.asitaDetails.memberSince)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Riwayat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Dibuat oleh</p>
                <p className="font-medium">{license.createdBy?.name || 'System'}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(license.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Terakhir diubah oleh</p>
                <p className="font-medium">{license.updatedBy?.name || 'System'}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(license.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Reminder Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4" />
                Status Reminder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: '30 hari', sent: license.remindersSent.days30 },
                  { label: '15 hari', sent: license.remindersSent.days15 },
                  { label: '7 hari', sent: license.remindersSent.days7 },
                  { label: '1 hari', sent: license.remindersSent.days1 },
                ].map((reminder) => (
                  <div key={reminder.label} className="flex items-center justify-between text-sm">
                    <span>Reminder {reminder.label}</span>
                    {reminder.sent ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alerts History */}
      {license.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Riwayat Alert
            </CardTitle>
            <CardDescription>
              Notifikasi yang pernah dikirim untuk izin ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {license.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    alert.isResolved ? 'bg-muted/50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {severityIcons[alert.severity]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${alert.isResolved ? 'text-muted-foreground line-through' : ''}`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(alert.createdAt)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {alert.isResolved ? (
                      <Badge variant="secondary">Resolved</Badge>
                    ) : alert.isRead ? (
                      <Badge variant="outline">Read</Badge>
                    ) : (
                      <Badge>Baru</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

