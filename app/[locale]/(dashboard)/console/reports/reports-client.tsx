/**
 * Reports Hub Client Component
 * Generate and export reports in various formats
 */

'use client';

import { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  PieChart,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type ReportCategory = 'finance' | 'operations' | 'marketing' | 'hr';

type ReportTemplate = {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  icon: React.ElementType;
};

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'revenue',
    name: 'Laporan Pendapatan',
    description: 'Revenue harian, mingguan, bulanan',
    category: 'finance',
    icon: TrendingUp,
  },
  {
    id: 'pnl',
    name: 'Profit & Loss',
    description: 'Shadow P&L per trip dan periode',
    category: 'finance',
    icon: BarChart3,
  },
  {
    id: 'bookings',
    name: 'Laporan Booking',
    description: 'Statistik booking dan conversion',
    category: 'operations',
    icon: Calendar,
  },
  {
    id: 'trips',
    name: 'Laporan Trip',
    description: 'Trip report dan occupancy rate',
    category: 'operations',
    icon: PieChart,
  },
  {
    id: 'marketing',
    name: 'Marketing Report',
    description: 'Campaign performance dan ROI',
    category: 'marketing',
    icon: TrendingUp,
  },
  {
    id: 'customers',
    name: 'Customer Report',
    description: 'Segmentasi dan behavior customer',
    category: 'marketing',
    icon: Users,
  },
  {
    id: 'guide-performance',
    name: 'Guide Performance',
    description: 'Rating dan kinerja guide',
    category: 'hr',
    icon: Users,
  },
];

export function ReportsClient() {
  const [category, setCategory] = useState<ReportCategory | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const filteredTemplates = category === 'all'
    ? REPORT_TEMPLATES
    : REPORT_TEMPLATES.filter((t) => t.category === category);

  const handleGenerateReport = async (templateId: string, format: 'pdf' | 'excel') => {
    if (!startDate || !endDate) {
      toast.error('Pilih rentang tanggal terlebih dahulu');
      return;
    }

    setIsGenerating(templateId);

    try {
      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(`Laporan ${format.toUpperCase()} berhasil di-generate`);
    } catch {
      toast.error('Gagal generate laporan');
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate dan export laporan dalam berbagai format
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter Periode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ReportCategory | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <ReportTemplateCard
            key={template.id}
            template={template}
            isGenerating={isGenerating === template.id}
            onGenerate={(format) => handleGenerateReport(template.id, format)}
          />
        ))}
      </div>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Reports
          </CardTitle>
          <CardDescription>
            Laporan otomatis yang dijadwalkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ScheduledReportItem
              name="Weekly Revenue Report"
              schedule="Setiap Senin 08:00"
              recipients={['finance@aerotravel.co.id']}
              format="Excel"
            />
            <ScheduledReportItem
              name="Monthly P&L Report"
              schedule="Tanggal 1 setiap bulan"
              recipients={['owner@aerotravel.co.id', 'finance@aerotravel.co.id']}
              format="PDF"
            />
            <ScheduledReportItem
              name="Guide Performance Weekly"
              schedule="Setiap Jumat 17:00"
              recipients={['ops@aerotravel.co.id']}
              format="Excel"
            />
          </div>
          <Button variant="outline" size="sm" className="mt-4">
            <Calendar className="mr-2 h-4 w-4" />
            Tambah Jadwal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-components

function ReportTemplateCard({
  template,
  isGenerating,
  onGenerate,
}: {
  template: ReportTemplate;
  isGenerating: boolean;
  onGenerate: (format: 'pdf' | 'excel') => void;
}) {
  const Icon = template.icon;
  const categoryColors: Record<ReportCategory, string> = {
    finance: 'text-green-600 bg-green-100',
    operations: 'text-blue-600 bg-blue-100',
    marketing: 'text-purple-600 bg-purple-100',
    hr: 'text-orange-600 bg-orange-100',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn('rounded-lg p-2', categoryColors[template.category])}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{template.name}</p>
            <p className="text-sm text-muted-foreground">{template.description}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={isGenerating}
            onClick={() => onGenerate('pdf')}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={isGenerating}
            onClick={() => onGenerate('excel')}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ScheduledReportItem({
  name,
  schedule,
  recipients,
  format,
}: {
  name: string;
  schedule: string;
  recipients: string[];
  format: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-muted-foreground">
          {schedule} • {format} • {recipients.join(', ')}
        </p>
      </div>
      <Button variant="ghost" size="sm">
        Edit
      </Button>
    </div>
  );
}

