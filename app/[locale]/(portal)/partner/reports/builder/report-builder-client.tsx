/**
 * Report Builder Client Component
 * Custom report builder with data source selection
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Calendar,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Layers,
  Loader2,
  Package,
  Save,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/partner';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type DataSource = 'bookings' | 'customers' | 'packages' | 'finance';

type ColumnConfig = {
  id: string;
  label: string;
  selected: boolean;
};

type ReportConfig = {
  name: string;
  dataSource: DataSource;
  columns: string[];
  filters: {
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
  };
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

type SavedReport = {
  id: string;
  name: string;
  dataSource: DataSource;
  config: ReportConfig;
  createdAt: string;
  lastRunAt: string | null;
};

const DATA_SOURCES: { id: DataSource; label: string; icon: React.ElementType }[] = [
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'packages', label: 'Packages', icon: Package },
  { id: 'finance', label: 'Finance', icon: Wallet },
];

const COLUMNS_BY_SOURCE: Record<DataSource, ColumnConfig[]> = {
  bookings: [
    { id: 'booking_code', label: 'Kode Booking', selected: true },
    { id: 'customer_name', label: 'Nama Customer', selected: true },
    { id: 'package_name', label: 'Paket', selected: true },
    { id: 'trip_date', label: 'Tanggal Trip', selected: true },
    { id: 'total_amount', label: 'Total', selected: true },
    { id: 'status', label: 'Status', selected: true },
    { id: 'pax_count', label: 'Jumlah Pax', selected: false },
    { id: 'created_at', label: 'Tanggal Booking', selected: false },
    { id: 'nta_total', label: 'NTA Total', selected: false },
    { id: 'margin', label: 'Margin', selected: false },
  ],
  customers: [
    { id: 'name', label: 'Nama', selected: true },
    { id: 'phone', label: 'Telepon', selected: true },
    { id: 'email', label: 'Email', selected: true },
    { id: 'segment', label: 'Segment', selected: true },
    { id: 'total_bookings', label: 'Total Bookings', selected: true },
    { id: 'total_spent', label: 'Total Spent', selected: true },
    { id: 'last_booking_date', label: 'Booking Terakhir', selected: false },
    { id: 'created_at', label: 'Tanggal Daftar', selected: false },
  ],
  packages: [
    { id: 'name', label: 'Nama Paket', selected: true },
    { id: 'destination', label: 'Destinasi', selected: true },
    { id: 'duration', label: 'Durasi', selected: true },
    { id: 'price_nta', label: 'Harga NTA', selected: true },
    { id: 'price_publish', label: 'Harga Publish', selected: true },
    { id: 'total_bookings', label: 'Total Bookings', selected: true },
    { id: 'revenue', label: 'Revenue', selected: false },
    { id: 'avg_rating', label: 'Rating', selected: false },
  ],
  finance: [
    { id: 'date', label: 'Tanggal', selected: true },
    { id: 'type', label: 'Tipe', selected: true },
    { id: 'description', label: 'Deskripsi', selected: true },
    { id: 'amount', label: 'Jumlah', selected: true },
    { id: 'balance', label: 'Saldo', selected: true },
    { id: 'booking_code', label: 'Kode Booking', selected: false },
  ],
};

type ReportBuilderClientProps = {
  locale: string;
};

export function ReportBuilderClient({ locale }: ReportBuilderClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [reportName, setReportName] = useState('');

  const [config, setConfig] = useState<ReportConfig>({
    name: '',
    dataSource: 'bookings',
    columns: COLUMNS_BY_SOURCE.bookings.filter((c) => c.selected).map((c) => c.id),
    filters: {},
  });

  const [columns, setColumns] = useState<ColumnConfig[]>(COLUMNS_BY_SOURCE.bookings);

  // Fetch saved reports
  const { data: savedReports, isLoading: reportsLoading } = useQuery<SavedReport[]>({
    queryKey: queryKeys.partner.customReports,
    queryFn: async () => {
      const response = await apiClient.get<{ reports: SavedReport[] }>(
        '/api/partner/reports/custom'
      );
      return response.reports;
    },
  });

  // Run report mutation
  const runReportMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/api/partner/reports/custom/run', {
        ...config,
        columns: columns.filter((c) => c.selected).map((c) => c.id),
      });
    },
    onSuccess: (data: any) => {
      toast.success(`Report berhasil: ${data.rowCount} baris`);
      // Trigger download
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    },
    onError: () => {
      toast.error('Gagal menjalankan report');
    },
  });

  // Save report mutation
  const saveReportMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/api/partner/reports/custom', {
        name: reportName,
        dataSource: config.dataSource,
        config: {
          ...config,
          name: reportName,
          columns: columns.filter((c) => c.selected).map((c) => c.id),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partner.customReports });
      toast.success('Report template tersimpan!');
      setShowSaveDialog(false);
    },
    onError: () => {
      toast.error('Gagal menyimpan report');
    },
  });

  const handleDataSourceChange = useCallback((source: DataSource) => {
    setConfig((prev) => ({ ...prev, dataSource: source }));
    setColumns(COLUMNS_BY_SOURCE[source]);
  }, []);

  const toggleColumn = useCallback((columnId: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? { ...c, selected: !c.selected } : c))
    );
  }, []);

  const loadSavedReport = useCallback((report: SavedReport) => {
    setConfig(report.config);
    setColumns(
      COLUMNS_BY_SOURCE[report.config.dataSource].map((c) => ({
        ...c,
        selected: report.config.columns.includes(c.id),
      }))
    );
    setStep(2);
    toast.success('Report template dimuat');
  }, []);

  const selectedColumnCount = columns.filter((c) => c.selected).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader
        title="Report Builder"
        description="Buat laporan kustom sesuai kebutuhan"
        backHref={`/${locale}/partner/reports`}
      />

      <div className="space-y-4 px-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                s === step
                  ? 'bg-primary text-white'
                  : s < step
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Step 1: Data Source & Saved Reports */}
        {step === 1 && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="h-5 w-5 text-primary" />
                  Pilih Sumber Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {DATA_SOURCES.map((source) => {
                    const Icon = source.icon;
                    return (
                      <button
                        key={source.id}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors',
                          config.dataSource === source.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted'
                        )}
                        onClick={() => handleDataSourceChange(source.id)}
                      >
                        <Icon
                          className={cn(
                            'h-6 w-6',
                            config.dataSource === source.id
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          )}
                        />
                        <span className="text-sm font-medium">{source.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Saved Reports */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" />
                  Report Tersimpan
                </CardTitle>
                <CardDescription>Load template report sebelumnya</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {reportsLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : savedReports && savedReports.length > 0 ? (
                  <ScrollArea className="max-h-[200px]">
                    <div className="divide-y">
                      {savedReports.map((report) => (
                        <button
                          key={report.id}
                          className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
                          onClick={() => loadSavedReport(report)}
                        >
                          <div>
                            <p className="font-medium">{report.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {report.dataSource} • {format(new Date(report.createdAt), 'd MMM yyyy', { locale: idLocale })}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada report tersimpan
                  </div>
                )}
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => setStep(2)}>
              Lanjut: Pilih Kolom
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}

        {/* Step 2: Column Selection */}
        {step === 2 && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Pilih Kolom
                  </span>
                  <Badge variant="secondary">{selectedColumnCount} dipilih</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {columns.map((column) => (
                    <label
                      key={column.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={column.selected}
                        onCheckedChange={() => toggleColumn(column.id)}
                      />
                      <span className="text-sm">{column.label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Kembali
              </Button>
              <Button
                className="flex-1"
                onClick={() => setStep(3)}
                disabled={selectedColumnCount === 0}
              >
                Lanjut: Filter
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Filters & Run */}
        {step === 3 && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Filter className="h-5 w-5 text-primary" />
                  Filter Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Dari Tanggal</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'mt-1 w-full justify-start text-left font-normal',
                            !config.filters.dateFrom && 'text-muted-foreground'
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {config.filters.dateFrom
                            ? format(config.filters.dateFrom, 'd MMM yy', { locale: idLocale })
                            : 'Pilih'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={config.filters.dateFrom}
                          onSelect={(date) =>
                            setConfig((prev) => ({
                              ...prev,
                              filters: { ...prev.filters, dateFrom: date },
                            }))
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-xs">Sampai Tanggal</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'mt-1 w-full justify-start text-left font-normal',
                            !config.filters.dateTo && 'text-muted-foreground'
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {config.filters.dateTo
                            ? format(config.filters.dateTo, 'd MMM yy', { locale: idLocale })
                            : 'Pilih'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={config.filters.dateTo}
                          onSelect={(date) =>
                            setConfig((prev) => ({
                              ...prev,
                              filters: { ...prev.filters, dateTo: date },
                            }))
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {config.dataSource === 'bookings' && (
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={config.filters.status || 'all'}
                      onValueChange={(value) =>
                        setConfig((prev) => ({
                          ...prev,
                          filters: { ...prev.filters, status: value === 'all' ? undefined : value },
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm font-medium">Ringkasan Report</p>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>Sumber: {DATA_SOURCES.find((s) => s.id === config.dataSource)?.label}</p>
                  <p>Kolom: {selectedColumnCount} kolom dipilih</p>
                  <p>
                    Filter:{' '}
                    {config.filters.dateFrom || config.filters.dateTo
                      ? `${config.filters.dateFrom ? format(config.filters.dateFrom, 'd MMM', { locale: idLocale }) : '...'} - ${config.filters.dateTo ? format(config.filters.dateTo, 'd MMM', { locale: idLocale }) : '...'}`
                      : 'Semua data'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                Kembali
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSaveDialog(true)}
              >
                <Save className="mr-2 h-4 w-4" />
                Simpan
              </Button>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={runReportMutation.isPending}
              onClick={() => runReportMutation.mutate()}
            >
              {runReportMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate & Download Report
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simpan Report Template</DialogTitle>
            <DialogDescription>
              Simpan konfigurasi report ini untuk digunakan lagi nanti
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Nama Report</Label>
            <Input
              className="mt-1"
              placeholder="Monthly Booking Report"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={() => saveReportMutation.mutate()}
              disabled={!reportName || saveReportMutation.isPending}
            >
              {saveReportMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

