'use client';

import { useState } from 'react';
import {
  Plus,
  RefreshCw,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Mail,
  Bell,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type Broadcast = {
  id: string;
  title: string;
  message: string;
  target_roles: string[];
  delivery_method: string[];
  scheduled_for: string | null;
  sent_at: string | null;
  recipient_count: number;
  success_count: number;
  failed_count: number;
  status: string;
  created_at: string;
};

type BroadcastsResponse = {
  broadcasts: Broadcast[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type BroadcastListClientProps = {
  locale: string;
};

async function fetchBroadcasts(page: number): Promise<BroadcastsResponse> {
  const response = await fetch(`/api/admin/notifications/broadcast?page=${page}&limit=20`);
  if (!response.ok) throw new Error('Failed to fetch broadcasts');
  return response.json();
}

const ROLE_OPTIONS = [
  { id: 'customer', label: 'Customers' },
  { id: 'guide', label: 'Guides' },
  { id: 'mitra', label: 'Mitra/Partners' },
  { id: 'ops_admin', label: 'Ops Admin' },
  { id: 'marketing', label: 'Marketing' },
];

const DELIVERY_OPTIONS = [
  { id: 'in_app', label: 'In-App', icon: Bell },
  { id: 'email', label: 'Email', icon: Mail },
];

export function BroadcastListClient({ locale }: BroadcastListClientProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [deliveryMethods, setDeliveryMethods] = useState<string[]>(['in_app']);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.admin.broadcasts.list(page),
    queryFn: () => fetchBroadcasts(page),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      message: string;
      targetRoles: string[];
      deliveryMethods: string[];
    }) => {
      const response = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          sendNow: true,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send broadcast');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Broadcast sent successfully');
      setIsCreateOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.broadcasts.all() });
    },
    onError: (error) => {
      logger.error('Create broadcast error', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send broadcast');
    },
  });

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setTargetRoles([]);
    setDeliveryMethods(['in_app']);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message || targetRoles.length === 0) {
      toast.error('Mohon lengkapi semua field yang wajib');
      return;
    }
    createMutation.mutate({ title, message, targetRoles, deliveryMethods });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const defaultConfig = { label: 'Draft', className: 'bg-gray-100 text-gray-800', icon: Clock };
    
    const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
      draft: defaultConfig,
      scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800', icon: Clock },
      sending: { label: 'Sending', className: 'bg-yellow-100 text-yellow-800', icon: Send },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status] ?? defaultConfig;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={cn('flex items-center gap-1', config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Buat Broadcast
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Buat Broadcast Baru</DialogTitle>
                <DialogDescription>
                  Kirim notifikasi ke banyak pengguna sekaligus
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Judul notifikasi..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Pesan *</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Isi pesan notifikasi..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Roles *</Label>
                  <div className="flex flex-wrap gap-3">
                    {ROLE_OPTIONS.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={targetRoles.includes(role.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setTargetRoles([...targetRoles, role.id]);
                            } else {
                              setTargetRoles(targetRoles.filter((r) => r !== role.id));
                            }
                          }}
                        />
                        <Label htmlFor={`role-${role.id}`} className="text-sm font-normal">
                          {role.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Metode Pengiriman *</Label>
                  <div className="flex gap-3">
                    {DELIVERY_OPTIONS.map((method) => {
                      const Icon = method.icon;
                      return (
                        <div key={method.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`method-${method.id}`}
                            checked={deliveryMethods.includes(method.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setDeliveryMethods([...deliveryMethods, method.id]);
                              } else {
                                setDeliveryMethods(deliveryMethods.filter((m) => m !== method.id));
                              }
                            }}
                          />
                          <Label htmlFor={`method-${method.id}`} className="flex items-center gap-1 text-sm font-normal">
                            <Icon className="h-4 w-4" />
                            {method.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Kirim Sekarang
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Broadcasts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Riwayat Broadcast
          </CardTitle>
          <CardDescription>
            {data?.pagination.total || 0} broadcast ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead className="text-center">Recipients</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dikirim</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  </TableRow>
                ))
              ) : data?.broadcasts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <p className="text-muted-foreground">Belum ada broadcast</p>
                  </TableCell>
                </TableRow>
              ) : (
                data?.broadcasts.map((broadcast) => (
                  <TableRow key={broadcast.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{broadcast.title}</p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {broadcast.message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {broadcast.target_roles?.slice(0, 2).map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                        {broadcast.target_roles?.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{broadcast.target_roles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {broadcast.delivery_method?.map((method) => (
                          <Badge key={method} variant="outline" className="text-xs">
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {broadcast.success_count}/{broadcast.recipient_count}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(broadcast.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(broadcast.sent_at || broadcast.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
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
    </div>
  );
}

