/**
 * Corporate Approvals List Client Component
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';



import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';

type Approval = {
  id: string;
  corporateId: string;
  bookingId: string;
  employeeId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAmount: number;
  approvedAmount: number | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  requestNotes: string | null;
  approverNotes: string | null;
  createdAt: string;
  employee?: {
    fullName: string;
    email: string;
    department: string | null;
  };
  booking?: {
    bookingCode: string;
    tripDate: string;
    totalPax: number;
    packageName: string | null;
    destination: string | null;
  };
};

type ApprovalsResponse = {
  approvals: Approval[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

type ApprovalsListClientProps = {
  locale: string;
};

export function ApprovalsListClient({ locale }: ApprovalsListClientProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [page, setPage] = useState(0);
  const limit = 10;

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [approverNotes, setApproverNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adjustedAmount, setAdjustedAmount] = useState<number | null>(null);

  // Fetch approvals
  const { data, isLoading, isFetching, error, refetch } = useQuery<ApprovalsResponse>({
    queryKey: queryKeys.corporate.approvals.list(statusFilter, page),
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await apiClient.get(
        `/api/partner/corporate/approvals?${params}`
      );
      return response.data as ApprovalsResponse;
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({
      approvalId,
      notes,
      amount,
    }: {
      approvalId: string;
      notes?: string;
      amount?: number;
    }) => {
      const response = await apiClient.patch(
        `/api/partner/corporate/approvals/${approvalId}`,
        {
          action: 'approve',
          approverNotes: notes,
          approvedAmount: amount,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Booking berhasil disetujui');
      queryClient.invalidateQueries({
        queryKey: queryKeys.corporate.approvals.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.corporate.dashboard(),
      });
      closeDialogs();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menyetujui booking');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({
      approvalId,
      reason,
    }: {
      approvalId: string;
      reason: string;
    }) => {
      const response = await apiClient.patch(
        `/api/partner/corporate/approvals/${approvalId}`,
        {
          action: 'reject',
          rejectionReason: reason,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Booking berhasil ditolak');
      queryClient.invalidateQueries({
        queryKey: queryKeys.corporate.approvals.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.corporate.dashboard(),
      });
      closeDialogs();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menolak booking');
    },
  });

  const closeDialogs = () => {
    setApproveDialogOpen(false);
    setRejectDialogOpen(false);
    setSelectedApproval(null);
    setApproverNotes('');
    setRejectionReason('');
    setAdjustedAmount(null);
  };

  const openApproveDialog = (approval: Approval) => {
    setSelectedApproval(approval);
    setAdjustedAmount(approval.requestedAmount);
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (approval: Approval) => {
    setSelectedApproval(approval);
    setRejectDialogOpen(true);
  };

  const handleApprove = () => {
    if (!selectedApproval) return;
    approveMutation.mutate({
      approvalId: selectedApproval.id,
      notes: approverNotes || undefined,
      amount: adjustedAmount || undefined,
    });
  };

  const handleReject = () => {
    if (!selectedApproval || !rejectionReason.trim()) {
      toast.error('Alasan penolakan wajib diisi');
      return;
    }
    rejectMutation.mutate({
      approvalId: selectedApproval.id,
      reason: rejectionReason,
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Disetujui
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Ditolak
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="secondary">
            <X className="h-3 w-3 mr-1" />
            Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Approval Booking</h1>
          <p className="text-sm text-muted-foreground">
            {data?.pagination.total || 0} approval
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 border rounded-md text-sm bg-background"
        >
          <option value="pending">Pending</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
          <option value="all">Semua</option>
        </select>
      </div>

      {/* Approvals List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-3" />
            <p className="font-medium mb-1 text-red-600">Gagal memuat data</p>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Terjadi kesalahan'}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      ) : !data?.approvals.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <p className="font-medium mb-1">
              {statusFilter === 'pending'
                ? 'Tidak ada pending approval'
                : 'Tidak ada data'}
            </p>
            <p className="text-sm text-muted-foreground">
              {statusFilter === 'pending'
                ? 'Semua booking sudah diproses'
                : 'Belum ada approval dengan status ini'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.approvals.map((approval) => (
            <Card
              key={approval.id}
              className={
                approval.status === 'pending'
                  ? 'border-amber-200 bg-amber-50/50'
                  : ''
              }
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {approval.booking?.bookingCode || 'N/A'}
                    {getStatusBadge(approval.status)}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(approval.createdAt), 'd MMM HH:mm', {
                      locale: idLocale,
                    })}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Package Info */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {approval.booking?.packageName || 'Paket tidak tersedia'}
                    </p>
                    {approval.booking?.destination && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {approval.booking.destination}
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {approval.employee?.fullName || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {approval.employee?.department || '-'}
                      </p>
                    </div>
                  </div>
                  {approval.booking?.tripDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {format(
                            new Date(approval.booking.tripDate),
                            'd MMM yyyy',
                            { locale: idLocale }
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {approval.booking.totalPax} pax
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Request Notes */}
                {approval.requestNotes && (
                  <div className="text-sm p-2 bg-muted/50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Catatan:</p>
                    <p>{approval.requestNotes}</p>
                  </div>
                )}

                {/* Amount */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <span className="text-sm text-muted-foreground">
                    {approval.status === 'approved' ? 'Jumlah Disetujui' : 'Total Biaya'}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(
                      approval.approvedAmount ?? approval.requestedAmount
                    )}
                  </span>
                </div>

                {/* Rejection Reason */}
                {approval.status === 'rejected' && approval.rejectionReason && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-600">
                        Alasan Penolakan:
                      </p>
                      <p className="text-sm text-red-700">
                        {approval.rejectionReason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions for pending */}
                {approval.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => openRejectDialog(approval)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Tolak
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => openApproveDialog(approval)}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Setujui
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {data.pagination.total > limit && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isFetching}
              >
                Sebelumnya
              </Button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                Halaman {page + 1} dari {Math.ceil(data.pagination.total / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.pagination.hasMore || isFetching}
              >
                {isFetching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Selanjutnya
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Booking</DialogTitle>
            <DialogDescription>
              Anda akan menyetujui permintaan booking dari{' '}
              <strong>{selectedApproval?.employee?.fullName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Jumlah Diminta:</p>
              <p className="text-lg font-bold">
                {selectedApproval && formatCurrency(selectedApproval.requestedAmount)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Jumlah Disetujui (opsional)</Label>
              <Input
                type="number"
                value={adjustedAmount || ''}
                onChange={(e) => setAdjustedAmount(Number(e.target.value) || null)}
                placeholder="Kosongkan jika sama dengan yang diminta"
              />
              <p className="text-xs text-muted-foreground">
                Anda dapat menyesuaikan jumlah yang disetujui
              </p>
            </div>

            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Textarea
                value={approverNotes}
                onChange={(e) => setApproverNotes(e.target.value)}
                placeholder="Catatan untuk karyawan..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>
              Batal
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Booking</DialogTitle>
            <DialogDescription>
              Anda akan menolak permintaan booking dari{' '}
              <strong>{selectedApproval?.employee?.fullName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Jumlah Diminta:</p>
              <p className="text-lg font-bold">
                {selectedApproval && formatCurrency(selectedApproval.requestedAmount)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Alasan Penolakan *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Berikan alasan penolakan..."
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground">
                Alasan ini akan dikirimkan ke karyawan
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              {rejectMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
