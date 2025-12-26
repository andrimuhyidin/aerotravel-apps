/**
 * Partner Invoices Client Component
 * REDESIGNED - Grouped by status, Clean cards, Payment actions
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PageHeader, FilterBar, StatusBadge } from '@/components/partner';
import { formatCurrency } from '@/lib/partner/package-utils';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';
import {
  Search,
  FileText,
  Download,
  CreditCard,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Invoice = {
  id: string;
  invoice_number: string;
  booking_code: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'overdue';
  due_date: string;
  paid_date: string | null;
  created_at: string;
  booking: {
    id: string;
    package_name: string;
    trip_date: string;
  } | null;
};

type InvoicesResponse = {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type InvoicesByStatus = {
  unpaid: Invoice[];
  overdue: Invoice[];
  paid: Invoice[];
};

export function InvoicesClient({ locale }: { locale: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState({
    overdue: true,
    unpaid: true,
    paid: false,
  });

  useEffect(() => {
    loadInvoices();
  }, [searchQuery, statusFilter]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await fetch(`/api/partner/invoices?${params}`);
      if (!res.ok) throw new Error('Failed to fetch invoices');

      const data: InvoicesResponse = await res.json();
      setInvoices(data.invoices);
    } catch (error) {
      logger.error('Failed to load invoices', error);
      toast.error('Gagal memuat data invoice');
    } finally {
      setLoading(false);
    }
  };

  // Group invoices by status
  const groupedInvoices: InvoicesByStatus = {
    overdue: invoices.filter((inv) => inv.status === 'overdue'),
    unpaid: invoices.filter((inv) => inv.status === 'unpaid'),
    paid: invoices.filter((inv) => inv.status === 'paid'),
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Calculate totals
  const totalUnpaid = groupedInvoices.unpaid.reduce((sum, inv) => sum + inv.amount, 0);
  const totalOverdue = groupedInvoices.overdue.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Invoice Management"
        description="Kelola invoice dan pembayaran"
      />

      {/* Summary Cards */}
      {!loading && (totalUnpaid > 0 || totalOverdue > 0) && (
        <div className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
          {totalOverdue > 0 && (
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Terlambat</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-red-700">
                  {formatCurrency(totalOverdue)}
                </p>
                <p className="text-xs text-red-600">{groupedInvoices.overdue.length} invoice</p>
              </CardContent>
            </Card>
          )}
          {totalUnpaid > 0 && (
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Belum Dibayar</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-orange-700">
                  {formatCurrency(totalUnpaid)}
                </p>
                <p className="text-xs text-orange-600">{groupedInvoices.unpaid.length} invoice</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar className="mx-4 mb-6">
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari invoice number, booking code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-full md:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="overdue">Terlambat</SelectItem>
              <SelectItem value="unpaid">Belum Dibayar</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      {/* Content */}
      <div className="space-y-4 px-4 pb-20">
        {loading ? (
          <InvoicesListSkeleton />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Tidak ada invoice"
            description="Invoice Anda akan muncul di sini"
          />
        ) : (
          <>
            {/* Overdue Section */}
            {groupedInvoices.overdue.length > 0 && (
              <InvoiceSection
                title="Terlambat"
                count={groupedInvoices.overdue.length}
                invoices={groupedInvoices.overdue}
                expanded={expandedSections.overdue}
                onToggle={() => toggleSection('overdue')}
                locale={locale}
                statusColor="text-red-600"
              />
            )}

            {/* Unpaid Section */}
            {groupedInvoices.unpaid.length > 0 && (
              <InvoiceSection
                title="Belum Dibayar"
                count={groupedInvoices.unpaid.length}
                invoices={groupedInvoices.unpaid}
                expanded={expandedSections.unpaid}
                onToggle={() => toggleSection('unpaid')}
                locale={locale}
                statusColor="text-orange-600"
              />
            )}

            {/* Paid Section */}
            {groupedInvoices.paid.length > 0 && (
              <InvoiceSection
                title="Lunas"
                count={groupedInvoices.paid.length}
                invoices={groupedInvoices.paid}
                expanded={expandedSections.paid}
                onToggle={() => toggleSection('paid')}
                locale={locale}
                statusColor="text-green-600"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Invoice Section Component
function InvoiceSection({
  title,
  count,
  invoices,
  expanded,
  onToggle,
  locale,
  statusColor,
}: {
  title: string;
  count: number;
  invoices: Invoice[];
  expanded: boolean;
  onToggle: () => void;
  locale: string;
  statusColor: string;
}) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-white p-4 shadow-sm hover:shadow-md">
        <h3 className={cn('text-base font-semibold', statusColor)}>
          {title} ({count})
        </h3>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {invoices.map((invoice) => (
          <InvoiceCard key={invoice.id} invoice={invoice} locale={locale} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Invoice Card Component
function InvoiceCard({ invoice, locale }: { invoice: Invoice; locale: string }) {
  const isOverdue = invoice.status === 'overdue';
  const isPaid = invoice.status === 'paid';

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="space-y-3 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-semibold text-foreground">{invoice.invoice_number}</p>
            <p className="text-sm text-muted-foreground">
              {invoice.booking?.package_name || 'N/A'}
            </p>
          </div>
          <StatusBadge
            status={invoice.status}
            variant="pill"
          />
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Booking Code</span>
            <span className="font-medium text-foreground">{invoice.booking_code}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="text-lg font-bold text-foreground">
              {formatCurrency(invoice.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Due Date</span>
            <span className={cn('font-medium', isOverdue && 'text-red-600')}>
              {new Date(invoice.due_date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          {isPaid && invoice.paid_date && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Paid Date</span>
              <span className="font-medium text-green-600">
                {new Date(invoice.paid_date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t pt-3">
          {!isPaid && (
            <Button variant="default" size="sm" className="flex-1">
              <CreditCard className="mr-1 h-3 w-3" />
              Bayar
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex-1">
            <Download className="mr-1 h-3 w-3" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function InvoicesListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-12 w-full" />
          {Array.from({ length: 2 }).map((_, j) => (
            <Skeleton key={j} className="h-40 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
