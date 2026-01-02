/**
 * Bulk Import Client Component
 * Upload Excel file to create multiple bookings
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { PageHeader } from '@/components/partner';
import { cn } from '@/lib/utils';
import { parseExcelFile, validateExcelData } from '@/lib/excel/import';
import { logger } from '@/lib/utils/logger';

type ImportRow = {
  rowNumber: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  package_slug?: string;
  travel_date?: string;
  pax_count?: number;
  special_requests?: string;
  status: 'pending' | 'valid' | 'error' | 'success' | 'failed';
  errors: string[];
  bookingId?: string;
};

type ImportStatus = 'idle' | 'parsing' | 'validating' | 'previewing' | 'importing' | 'complete';

const REQUIRED_COLUMNS = [
  'customer_name',
  'customer_phone',
  'package_slug',
  'travel_date',
  'pax_count',
];

const TEMPLATE_COLUMNS = [
  { header: 'customer_name', description: 'Nama lengkap customer', example: 'John Doe' },
  { header: 'customer_phone', description: 'No. HP dengan kode negara', example: '6281234567890' },
  { header: 'customer_email', description: 'Email (opsional)', example: 'john@example.com' },
  { header: 'package_slug', description: 'Slug paket dari katalog', example: 'pahawang-3d2n' },
  { header: 'travel_date', description: 'Tanggal berangkat (YYYY-MM-DD)', example: '2026-02-15' },
  { header: 'pax_count', description: 'Jumlah peserta', example: '4' },
  { header: 'special_requests', description: 'Permintaan khusus (opsional)', example: 'Vegetarian' },
];

function downloadTemplate() {
  const csvContent = [
    TEMPLATE_COLUMNS.map((c) => c.header).join(','),
    TEMPLATE_COLUMNS.map((c) => c.example).join(','),
    // Add empty rows as examples
    'Jane Smith,6289876543210,jane@example.com,belitung-4d3n,2026-02-20,2,Alergi seafood',
    'Keluarga Ahmad,6281122334455,,pahawang-2d1n,2026-02-25,6,',
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bulk-booking-template.csv';
  link.click();
  URL.revokeObjectURL(url);
  toast.success('Template berhasil diunduh!');
}

type BulkImportClientProps = {
  locale: string;
};

export function BulkImportClient({ locale }: BulkImportClientProps) {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter((r) => r.status === 'valid' || r.status === 'success');
  const errorRows = rows.filter((r) => r.status === 'error' || r.status === 'failed');
  const successRows = rows.filter((r) => r.status === 'success');

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    setFileName(file.name);
    setStatus('parsing');
    setRows([]);
    setProgress(0);

    try {
      // Parse Excel/CSV file
      const data = await parseExcelFile<Record<string, unknown>>(file);
      
      // Validate structure
      const validation = validateExcelData(data, REQUIRED_COLUMNS);
      if (!validation.valid) {
        toast.error(validation.errors.join(', '));
        setStatus('idle');
        return;
      }

      setStatus('validating');

      // Convert to ImportRow with validation
      const importRows: ImportRow[] = data.map((row, index) => {
        const errors: string[] = [];
        
        // Validate required fields
        if (!row.customer_name) errors.push('Nama customer wajib diisi');
        if (!row.customer_phone) errors.push('No. HP wajib diisi');
        if (!row.package_slug) errors.push('Package slug wajib diisi');
        if (!row.travel_date) errors.push('Tanggal travel wajib diisi');
        if (!row.pax_count || Number(row.pax_count) < 1) errors.push('Pax count minimal 1');

        // Validate date format
        if (row.travel_date) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(String(row.travel_date))) {
            errors.push('Format tanggal harus YYYY-MM-DD');
          }
        }

        // Validate phone format
        if (row.customer_phone) {
          const phone = String(row.customer_phone).replace(/\D/g, '');
          if (phone.length < 10 || phone.length > 15) {
            errors.push('No. HP tidak valid');
          }
        }

        return {
          rowNumber: index + 2, // +2 because row 1 is header
          customer_name: String(row.customer_name || ''),
          customer_phone: String(row.customer_phone || ''),
          customer_email: row.customer_email ? String(row.customer_email) : undefined,
          package_slug: String(row.package_slug || ''),
          travel_date: String(row.travel_date || ''),
          pax_count: Number(row.pax_count) || 1,
          special_requests: row.special_requests ? String(row.special_requests) : undefined,
          status: errors.length > 0 ? 'error' : 'valid',
          errors,
        };
      });

      setRows(importRows);
      setStatus('previewing');

      const validCount = importRows.filter((r) => r.status === 'valid').length;
      const errorCount = importRows.filter((r) => r.status === 'error').length;
      
      if (errorCount > 0) {
        toast.warning(`${errorCount} baris memiliki error, ${validCount} baris valid`);
      } else {
        toast.success(`${validCount} baris siap diimport`);
      }
    } catch (error) {
      logger.error('Failed to parse file', error);
      toast.error('Gagal membaca file. Pastikan format file valid.');
      setStatus('idle');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleImport = useCallback(async () => {
    const rowsToImport = rows.filter((r) => r.status === 'valid');
    if (rowsToImport.length === 0) {
      toast.error('Tidak ada baris valid untuk diimport');
      return;
    }

    setStatus('importing');
    setProgress(0);

    const total = rowsToImport.length;
    let completed = 0;

    for (const row of rowsToImport) {
      try {
        const response = await fetch('/api/partner/bookings/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: row.customer_name,
            customerPhone: row.customer_phone,
            customerEmail: row.customer_email,
            packageSlug: row.package_slug,
            travelDate: row.travel_date,
            paxCount: row.pax_count,
            specialRequests: row.special_requests,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error((errorData as { error?: string }).error || 'Import failed');
        }

        const result = await response.json();
        
        setRows((prev) =>
          prev.map((r) =>
            r.rowNumber === row.rowNumber
              ? { ...r, status: 'success', bookingId: (result as { bookingId?: string }).bookingId }
              : r
          )
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setRows((prev) =>
          prev.map((r) =>
            r.rowNumber === row.rowNumber
              ? { ...r, status: 'failed', errors: [...r.errors, errorMessage] }
              : r
          )
        );
      }

      completed++;
      setProgress((completed / total) * 100);
    }

    setStatus('complete');
    
    const finalRows = rows.filter((r) => r.status === 'valid');
    const successCount = finalRows.filter((r) => r.status === 'success').length;
    const failedCount = finalRows.filter((r) => r.status === 'failed').length;

    if (failedCount === 0) {
      toast.success(`${successCount} booking berhasil dibuat!`);
    } else {
      toast.warning(`${successCount} berhasil, ${failedCount} gagal`);
    }
  }, [rows]);

  const reset = useCallback(() => {
    setStatus('idle');
    setRows([]);
    setProgress(0);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader
        title="Bulk Import Booking"
        description="Upload file Excel untuk membuat booking massal"
        action={
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        }
      />

      <div className="space-y-4 px-4">
        {/* Upload Area */}
        {status === 'idle' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Upload File
              </CardTitle>
              <CardDescription>
                Upload file Excel (.xlsx) atau CSV dengan format yang sesuai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6 transition-colors hover:border-primary hover:bg-primary/5"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                <p className="mb-2 text-sm font-medium">
                  Drop file di sini atau klik untuk upload
                </p>
                <p className="text-xs text-muted-foreground">
                  Format: .xlsx, .csv (max 500 baris)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parsing/Validating Status */}
        {(status === 'parsing' || status === 'validating') && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
                <p className="font-medium">
                  {status === 'parsing' ? 'Membaca file...' : 'Memvalidasi data...'}
                </p>
                <p className="text-sm text-muted-foreground">{fileName}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview & Import */}
        {(status === 'previewing' || status === 'importing' || status === 'complete') && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{rows.length}</p>
                  <p className="text-xs text-muted-foreground">Total Baris</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {status === 'complete' ? successRows.length : validRows.length}
                  </p>
                  <p className="text-xs text-green-600">
                    {status === 'complete' ? 'Sukses' : 'Valid'}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{errorRows.length}</p>
                  <p className="text-xs text-red-600">Error</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar during import */}
            {status === 'importing' && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <div className="flex-1">
                      <Progress value={progress} className="h-2" />
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    Mengimport booking... Jangan tutup halaman ini.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Error Summary */}
            {errorRows.length > 0 && status === 'previewing' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ada {errorRows.length} baris dengan error</AlertTitle>
                <AlertDescription>
                  Perbaiki error atau baris tersebut akan dilewati saat import.
                </AlertDescription>
              </Alert>
            )}

            {/* Data Preview Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Preview Data</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Row</TableHead>
                        <TableHead className="w-[80px]">Status</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Pax</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow
                          key={row.rowNumber}
                          className={cn(
                            row.status === 'error' && 'bg-red-50',
                            row.status === 'success' && 'bg-green-50',
                            row.status === 'failed' && 'bg-red-50'
                          )}
                        >
                          <TableCell className="text-xs text-muted-foreground">
                            {row.rowNumber}
                          </TableCell>
                          <TableCell>
                            {row.status === 'valid' && (
                              <Badge variant="outline" className="text-xs">
                                Valid
                              </Badge>
                            )}
                            {row.status === 'error' && (
                              <Badge variant="destructive" className="text-xs">
                                Error
                              </Badge>
                            )}
                            {row.status === 'success' && (
                              <Badge className="bg-green-500 text-xs">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                OK
                              </Badge>
                            )}
                            {row.status === 'failed' && (
                              <Badge variant="destructive" className="text-xs">
                                <XCircle className="mr-1 h-3 w-3" />
                                Gagal
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{row.customer_name}</TableCell>
                          <TableCell className="text-xs">{row.customer_phone}</TableCell>
                          <TableCell className="text-xs">{row.package_slug}</TableCell>
                          <TableCell className="text-xs">{row.travel_date}</TableCell>
                          <TableCell className="text-xs">{row.pax_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={reset}
                disabled={status === 'importing'}
              >
                <X className="mr-2 h-4 w-4" />
                Reset
              </Button>
              {status === 'previewing' && (
                <Button
                  className="flex-1"
                  onClick={handleImport}
                  disabled={validRows.length === 0}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import {validRows.length} Booking
                </Button>
              )}
              {status === 'complete' && (
                <Button
                  className="flex-1"
                  onClick={() => (window.location.href = `/${locale}/partner/bookings`)}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Lihat Bookings
                </Button>
              )}
            </div>
          </>
        )}

        {/* Template Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Format Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kolom</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Contoh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TEMPLATE_COLUMNS.map((col) => (
                    <TableRow key={col.header}>
                      <TableCell className="font-mono text-xs">
                        {col.header}
                        {REQUIRED_COLUMNS.includes(col.header) && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{col.description}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {col.example}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="text-red-500">*</span> Kolom wajib diisi
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

