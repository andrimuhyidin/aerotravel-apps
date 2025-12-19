'use client';

/**
 * Console: Resignations Management Client
 * Review and manage guide resignation requests
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  XCircle,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type ResignationsManagementClientProps = {
  locale: string;
};

type Resignation = {
  id: string;
  contract_id: string;
  guide_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  reason: string;
  effective_date: string;
  notice_period_days: number;
  submitted_at: string;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  review_notes?: string | null;
  contract?: {
    id: string;
    contract_number: string;
    title: string;
    status: string;
  } | null;
  guide?: {
    id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  reviewed_by_user?: {
    id: string;
    full_name: string | null;
  } | null;
};

export function ResignationsManagementClient({ locale }: ResignationsManagementClientProps) {
  const queryClient = useQueryClient();
  const [selectedResignation, setSelectedResignation] = useState<Resignation | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, error, refetch } = useQuery<{ data: Resignation[] }>({
    queryKey: ['admin', 'guide', 'contracts', 'resignations', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const res = await fetch(`/api/admin/guide/contracts/resignations?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load resignations');
      return res.json();
    },
  });

  const resignations = data?.data || [];

  const approveMutation = useMutation({
    mutationFn: async (resignationId: string) => {
      const res = await fetch(`/api/admin/guide/contracts/resignations/${resignationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_notes: reviewNotes }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Gagal menyetujui resign');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'guide', 'contracts', 'resignations'] });
      setShowApproveDialog(false);
      setSelectedResignation(null);
      setReviewNotes('');
      toast.success('Resign telah disetujui');
    },
    onError: (error) => {
      logger.error('Failed to approve resignation', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menyetujui resign');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (resignationId: string) => {
      const res = await fetch(`/api/admin/guide/contracts/resignations/${resignationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejection_reason: rejectionReason,
          review_notes: reviewNotes,
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Gagal menolak resign');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'guide', 'contracts', 'resignations'] });
      setShowRejectDialog(false);
      setSelectedResignation(null);
      setRejectionReason('');
      setReviewNotes('');
      toast.success('Resign telah ditolak');
    },
    onError: (error) => {
      logger.error('Failed to reject resignation', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menolak resign');
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <LoadingState variant="spinner" message="Memuat pengajuan resign..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <ErrorState
            message="Gagal memuat pengajuan resign"
            onRetry={() => void refetch()}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  const pendingResignations = resignations.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/console/guide/contracts`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Pengajuan Resign Guide</h1>
          <p className="text-sm text-slate-600">
            {pendingResignations.length} pengajuan pending
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          Semua
        </Button>
        <Button
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('pending')}
        >
          Pending ({pendingResignations.length})
        </Button>
        <Button
          variant={statusFilter === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('approved')}
        >
          Disetujui
        </Button>
        <Button
          variant={statusFilter === 'rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('rejected')}
        >
          Ditolak
        </Button>
      </div>

      {/* Resignations List */}
      {resignations.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <LogOut className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-600">Tidak ada pengajuan resign</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {resignations.map((resignation) => (
            <Card key={resignation.id} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-slate-900">
                        {resignation.contract?.title || 'Kontrak'}
                      </h3>
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium',
                          resignation.status === 'pending' && 'bg-amber-100 text-amber-700',
                          resignation.status === 'approved' && 'bg-emerald-100 text-emerald-700',
                          resignation.status === 'rejected' && 'bg-red-100 text-red-700',
                          resignation.status === 'withdrawn' && 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {resignation.status === 'pending' && 'Pending'}
                        {resignation.status === 'approved' && 'Disetujui'}
                        {resignation.status === 'rejected' && 'Ditolak'}
                        {resignation.status === 'withdrawn' && 'Ditarik'}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-slate-500">Guide:</span>{' '}
                        <span className="font-medium text-slate-900">
                          {resignation.guide?.full_name || resignation.guide?.email || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Kontrak:</span>{' '}
                        <span className="font-medium text-slate-900">
                          {resignation.contract?.contract_number || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Alasan:</span>
                        <p className="font-medium text-slate-900 mt-1">{resignation.reason}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Tanggal Efektif:</span>{' '}
                        <span className="font-medium text-slate-900">
                          {formatDate(resignation.effective_date)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Diajukan:</span>{' '}
                        <span className="font-medium text-slate-900">
                          {formatDate(resignation.submitted_at)}
                        </span>
                      </div>
                      {resignation.reviewed_at && (
                        <div>
                          <span className="text-slate-500">Direview oleh:</span>{' '}
                          <span className="font-medium text-slate-900">
                            {resignation.reviewed_by_user?.full_name || '-'} pada{' '}
                            {formatDate(resignation.reviewed_at)}
                          </span>
                        </div>
                      )}
                      {resignation.rejection_reason && (
                        <div>
                          <span className="text-slate-500">Alasan Penolakan:</span>
                          <p className="font-medium text-red-600 mt-1">
                            {resignation.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {resignation.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          setSelectedResignation(resignation);
                          setShowApproveDialog(true);
                        }}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedResignation(resignation);
                          setShowRejectDialog(true);
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Tolak
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Pengajuan Resign</DialogTitle>
            <DialogDescription>
              Setujui pengajuan resign ini. Kontrak akan dihentikan secara otomatis.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan Review (Opsional)</label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Tambahkan catatan review..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                if (selectedResignation) {
                  approveMutation.mutate(selectedResignation.id);
                }
              }}
              disabled={approveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Setujui
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pengajuan Resign</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan pengajuan resign ini (minimal 10 karakter)
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Alasan Penolakan *</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Masukkan alasan penolakan..."
                className="min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-slate-500">
                {rejectionReason.length}/500 karakter
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan Review (Opsional)</label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Tambahkan catatan review..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                if (selectedResignation) {
                  rejectMutation.mutate(selectedResignation.id);
                }
              }}
              disabled={rejectionReason.trim().length < 10 || rejectMutation.isPending}
              variant="destructive"
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Tolak
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
