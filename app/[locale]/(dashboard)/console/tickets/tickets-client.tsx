/**
 * Tickets & Complaints Client Component
 * Support ticketing with SLA timer and status management
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  RefreshCw,
  Timer,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import queryKeys from '@/lib/queries/query-keys';

type Ticket = {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  description: string;
  created_at: string;
  customerName: string;
  customerEmail: string;
  assigneeName: string | null;
  ageMinutes: number;
  slaRemaining: number;
  isOverdue: boolean;
};

type TicketsResponse = {
  tickets: Ticket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    overdue: number;
  };
};

async function fetchTickets(
  status: string,
  priority: string,
  page: number
): Promise<TicketsResponse> {
  const params = new URLSearchParams({
    status,
    priority,
    page: page.toString(),
    limit: '20',
  });
  const response = await fetch(`/api/admin/tickets?${params}`);
  if (!response.ok) throw new Error('Failed to fetch tickets');
  return response.json();
}

function formatDuration(minutes: number): string {
  if (minutes < 0) return 'Overdue';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatAge(minutes: number): string {
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function TicketsClient() {
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'tickets', status, priority, page],
    queryFn: () => fetchTickets(status, priority, page),
    refetchInterval: 30000, // Refresh every 30 seconds for SLA updates
  });

  useEffect(() => {
    if (error) {
      toast.error('Gagal memuat data tickets');
    }
  }, [error]);

  if (isLoading) {
    return <TicketsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets & Complaints</h1>
          <p className="text-muted-foreground">
            Kelola tiket support dan keluhan customer
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Buat Tiket
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {data?.stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Total Tickets"
            value={data.stats.total}
            icon={MessageSquare}
            color="blue"
          />
          <StatsCard
            title="Open"
            value={data.stats.open}
            icon={AlertCircle}
            color="yellow"
          />
          <StatsCard
            title="In Progress"
            value={data.stats.inProgress}
            icon={Clock}
            color="blue"
          />
          <StatsCard
            title="Resolved"
            value={data.stats.resolved}
            icon={CheckCircle2}
            color="green"
          />
          <StatsCard
            title="Overdue"
            value={data.stats.overdue}
            icon={AlertTriangle}
            color="red"
            highlight={data.stats.overdue > 0}
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Daftar Tiket</CardTitle>
              <CardDescription>
                {data?.pagination.total || 0} tiket ditemukan
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priority} onValueChange={(v) => { setPriority(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.tickets.map((ticket) => (
                  <TicketRow key={ticket.id} ticket={ticket} />
                ))}
                {(!data?.tickets || data.tickets.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Tidak ada tiket ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Halaman {data.pagination.page} dari {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-components

type StatsCardProps = {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'yellow' | 'green' | 'red';
  highlight?: boolean;
};

function StatsCard({ title, value, icon: Icon, color, highlight }: StatsCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  };

  return (
    <Card className={cn(highlight && 'border-red-500 bg-red-50 dark:bg-red-900/10')}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-lg p-2', colorClasses[color])}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const priorityColors = {
    urgent: 'destructive',
    high: 'default',
    medium: 'secondary',
    low: 'outline',
  } as const;

  const statusColors = {
    open: 'outline',
    in_progress: 'secondary',
    resolved: 'default',
    escalated: 'destructive',
  } as const;

  const categoryLabels: Record<string, string> = {
    facility: 'Fasilitas',
    food: 'Makanan',
    guide: 'Guide',
    payment: 'Pembayaran',
    booking: 'Booking',
    other: 'Lainnya',
  };

  return (
    <TableRow className={cn(ticket.isOverdue && 'bg-red-50 dark:bg-red-900/10')}>
      <TableCell>
        <div>
          <p className="font-mono text-sm font-medium">{ticket.ticket_number}</p>
          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
            {ticket.subject}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-muted p-1.5">
            <User className="h-3 w-3" />
          </div>
          <div>
            <p className="text-sm font-medium">{ticket.customerName}</p>
            <p className="text-xs text-muted-foreground">{ticket.customerEmail}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{categoryLabels[ticket.category] || ticket.category}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={priorityColors[ticket.priority]} className="uppercase text-xs">
          {ticket.priority}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={statusColors[ticket.status]}>
          {ticket.status === 'open' && <AlertCircle className="mr-1 h-3 w-3" />}
          {ticket.status === 'in_progress' && <Clock className="mr-1 h-3 w-3" />}
          {ticket.status === 'resolved' && <CheckCircle2 className="mr-1 h-3 w-3" />}
          {ticket.status === 'escalated' && <AlertTriangle className="mr-1 h-3 w-3" />}
          {ticket.status.replace('_', ' ')}
        </Badge>
      </TableCell>
      <TableCell>
        <div className={cn('flex items-center gap-1', ticket.isOverdue && 'text-red-600')}>
          <Timer className="h-3 w-3" />
          <span className="text-sm font-medium">
            {ticket.isOverdue ? 'OVERDUE' : formatDuration(ticket.slaRemaining)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{formatAge(ticket.ageMinutes)}</p>
      </TableCell>
      <TableCell>
        {ticket.assigneeName ? (
          <span className="text-sm">{ticket.assigneeName}</span>
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function TicketsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-20 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

