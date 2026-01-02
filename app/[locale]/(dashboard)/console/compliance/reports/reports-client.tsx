/**
 * Compliance Reports Client Component
 * Advanced reporting with export functionality
 */

'use client';

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  PieChart,
  RefreshCw,
  Shield,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { logger } from '@/lib/utils/logger';

type ReportData = {
  reportTitle: string;
  generatedAt: string;
  year: number;
  complianceScore: number;
  statistics: {
    totalLicenses: number;
    byStatus: {
      valid: number;
      warning: number;
      critical: number;
      expired: number;
      suspended: number;
    };
    byType: Record<string, number>;
    alertsSummary: {
      total: number;
      resolved: number;
      unresolved: number;
      bySeverity: {
        info: number;
        warning: number;
        critical: number;
      };
    };
  };
  licenses: Array<{
    licenseType: string;
    licenseNumber: string;
    licenseName: string;
    issuedBy: string;
    issuedDate: string;
    expiryDate: string | null;
    status: string;
    daysUntilExpiry: number | null;
    asitaDetails: {
      nia: string;
      membership_type: string;
      dpd_region: string | null;
      member_since: string;
    } | null;
  }>;
  renewalTimeline: Array<{
    month: string;
    licenses: Array<{
      name: string;
      type: string;
      expiryDate: string;
    }>;
  }>;
  recommendations: string[];
};

const licenseTypeLabels: Record<string, string> = {
  nib: 'NIB',
  skdn: 'SKDN',
  sisupar: 'SISUPAR',
  tdup: 'TDUP',
  asita: 'ASITA',
  chse: 'CHSE',
};

const statusColors: Record<string, string> = {
  valid: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
  expired: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-100 text-gray-700',
};

type ComplianceReportsClientProps = {
  locale: string;
};

export function ComplianceReportsClient({ locale }: ComplianceReportsClientProps) {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);
  const [showRenewalTimeline, setShowRenewalTimeline] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchReport();
  }, [selectedYear]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/compliance/reports?year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        toast.error('Gagal memuat laporan');
      }
    } catch (error) {
      logger.error('Failed to fetch report', error);
      toast.error('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (!reportData) return;

    setIsExporting(true);

    try {
      // Dynamic import ExcelJS
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();

      // Summary sheet
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Metrik', key: 'metric', width: 30 },
        { header: 'Nilai', key: 'value', width: 20 },
      ];
      summarySheet.addRow({ metric: 'Tahun Laporan', value: reportData.year });
      summarySheet.addRow({ metric: 'Compliance Score', value: `${reportData.complianceScore}%` });
      summarySheet.addRow({ metric: 'Total Izin', value: reportData.statistics.totalLicenses });
      summarySheet.addRow({ metric: 'Izin Valid', value: reportData.statistics.byStatus.valid });
      summarySheet.addRow({ metric: 'Izin Warning', value: reportData.statistics.byStatus.warning });
      summarySheet.addRow({ metric: 'Izin Critical', value: reportData.statistics.byStatus.critical });
      summarySheet.addRow({ metric: 'Izin Expired', value: reportData.statistics.byStatus.expired });
      summarySheet.addRow({ metric: 'Total Alert', value: reportData.statistics.alertsSummary.total });
      summarySheet.addRow({ metric: 'Alert Resolved', value: reportData.statistics.alertsSummary.resolved });
      summarySheet.getRow(1).font = { bold: true };

      // Licenses sheet
      const licensesSheet = workbook.addWorksheet('Daftar Izin');
      licensesSheet.columns = [
        { header: 'Tipe', key: 'type', width: 15 },
        { header: 'Nama Izin', key: 'name', width: 30 },
        { header: 'Nomor', key: 'number', width: 25 },
        { header: 'Diterbitkan Oleh', key: 'issuer', width: 20 },
        { header: 'Tanggal Terbit', key: 'issuedDate', width: 15 },
        { header: 'Tanggal Expiry', key: 'expiryDate', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Sisa Hari', key: 'daysLeft', width: 12 },
      ];

      reportData.licenses.forEach((license) => {
        licensesSheet.addRow({
          type: licenseTypeLabels[license.licenseType] || license.licenseType,
          name: license.licenseName,
          number: license.licenseNumber,
          issuer: license.issuedBy,
          issuedDate: license.issuedDate,
          expiryDate: license.expiryDate || 'N/A',
          status: license.status.toUpperCase(),
          daysLeft: license.daysUntilExpiry ?? 'N/A',
        });
      });
      licensesSheet.getRow(1).font = { bold: true };
      licensesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Recommendations sheet
      const recsSheet = workbook.addWorksheet('Rekomendasi');
      recsSheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Rekomendasi', key: 'recommendation', width: 80 },
      ];

      reportData.recommendations.forEach((rec, idx) => {
        recsSheet.addRow({ no: idx + 1, recommendation: rec });
      });
      recsSheet.getRow(1).font = { bold: true };

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Compliance_Report_${reportData.year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Laporan berhasil diexport ke Excel');
    } catch (error) {
      logger.error('Failed to export to Excel', error);
      toast.error('Gagal export ke Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    toast.info('Export PDF akan tersedia segera. Gunakan Export Excel untuk sementara.');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Gagal memuat laporan</p>
        <Button className="mt-4" onClick={fetchReport}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  const scoreColor =
    reportData.complianceScore >= 80
      ? 'text-green-600'
      : reportData.complianceScore >= 60
        ? 'text-amber-600'
        : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/console/compliance`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Compliance Reports</h1>
            <p className="text-muted-foreground">
              Laporan kepatuhan izin usaha
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v, 10))}
          >
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchReport}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Export Options */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{reportData.reportTitle}</p>
              <p className="text-xs text-muted-foreground">
                Dibuat: {format(new Date(reportData.generatedAt), 'dd MMMM yyyy, HH:mm', { locale: localeId })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Export Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="p-6 text-center">
            <div className="relative mx-auto mb-4 h-32 w-32">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${reportData.complianceScore} 100`}
                  className={scoreColor}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${scoreColor}`}>
                  {reportData.complianceScore}%
                </span>
              </div>
            </div>
            <h3 className="text-lg font-semibold">Compliance Score</h3>
            <p className="text-sm text-muted-foreground">
              {reportData.complianceScore >= 80
                ? 'Baik - Semua izin dalam kondisi valid'
                : reportData.complianceScore >= 60
                  ? 'Perhatian - Beberapa izin perlu diperbarui'
                  : 'Kritis - Segera perbarui izin expired'}
            </p>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistik Izin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{reportData.statistics.totalLicenses}</p>
                <p className="text-xs text-muted-foreground">Total Izin</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">
                  {reportData.statistics.byStatus.valid}
                </p>
                <p className="text-xs text-muted-foreground">Valid</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {reportData.statistics.byStatus.warning}
                </p>
                <p className="text-xs text-muted-foreground">Warning</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">
                  {reportData.statistics.byStatus.critical}
                </p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">
                  {reportData.statistics.byStatus.expired}
                </p>
                <p className="text-xs text-muted-foreground">Expired</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">
                  {reportData.statistics.alertsSummary.unresolved}
                </p>
                <p className="text-xs text-muted-foreground">Open Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Rekomendasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {reportData.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {rec}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Renewal Timeline */}
      <Collapsible open={showRenewalTimeline} onOpenChange={setShowRenewalTimeline}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <CardTitle className="text-base">Timeline Perpanjangan</CardTitle>
              </div>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  showRenewalTimeline ? 'rotate-180' : ''
                }`}
              />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {reportData.renewalTimeline.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Tidak ada izin yang expire dalam 12 bulan ke depan
                </p>
              ) : (
                <div className="space-y-4">
                  {reportData.renewalTimeline.map((item, idx) => (
                    <div key={idx} className="border-l-2 border-primary pl-4">
                      <p className="font-medium text-primary">{item.month}</p>
                      <div className="mt-2 space-y-1">
                        {item.licenses.map((license, lIdx) => (
                          <div
                            key={lIdx}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                          >
                            <div>
                              <p className="font-medium">{license.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {licenseTypeLabels[license.type] || license.type}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {format(new Date(license.expiryDate), 'dd MMM yyyy', { locale: localeId })}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Licenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Daftar Izin Usaha
          </CardTitle>
          <CardDescription>
            Detail semua izin usaha yang terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipe</TableHead>
                <TableHead>Nama Izin</TableHead>
                <TableHead>Nomor</TableHead>
                <TableHead>Tanggal Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sisa Hari</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.licenses.map((license, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Badge variant="outline">
                      {licenseTypeLabels[license.licenseType] || license.licenseType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{license.licenseName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {license.licenseNumber}
                  </TableCell>
                  <TableCell>
                    {license.expiryDate
                      ? format(new Date(license.expiryDate), 'dd MMM yyyy', { locale: localeId })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[license.status] || 'bg-gray-100'}>
                      {license.status === 'valid' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {license.status === 'warning' && <Clock className="h-3 w-3 mr-1" />}
                      {(license.status === 'critical' || license.status === 'expired') && (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {license.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {license.daysUntilExpiry !== null ? (
                      <span
                        className={
                          license.daysUntilExpiry <= 7
                            ? 'text-red-600 font-medium'
                            : license.daysUntilExpiry <= 30
                              ? 'text-amber-600'
                              : ''
                        }
                      >
                        {license.daysUntilExpiry} hari
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

