'use client';

/**
 * Console: Contract Detail Admin Client
 * View contract details, sign, terminate, download PDF
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Ban,
    CheckCircle2,
    Download,
    FileText,
    Loader2,
    Send,
    XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type ContractDetailAdminClientProps = {
  locale: string;
  contractId: string;
};

type Contract = {
  id: string;
  contract_number: string;
  contract_type: string;
  title: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  fee_amount: number;
  fee_type: string;
  payment_terms?: string | null;
  terms_and_conditions?: Record<string, unknown>;
  status: string;
  guide_signed_at?: string | null;
  company_signed_at?: string | null;
  guide_signature_url?: string | null;
  company_signature_url?: string | null;
  signed_pdf_url?: string | null;
  expires_at?: string | null;
  guide_id: string;
  guide: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  trips?: Array<unknown>;
  payments?: Array<unknown>;
};

export function ContractDetailAdminClient({
  locale,
  contractId,
}: ContractDetailAdminClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [showSanctionDialog, setShowSanctionDialog] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  const { data, isLoading, error, refetch } = useQuery<{ contract: Contract }>({
    queryKey: ['admin', 'guide', 'contracts', 'detail', contractId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/guide/contracts/${contractId}`);
      if (!res.ok) throw new Error('Failed to load contract');
      return res.json();
    },
  });

  const contract = data?.contract;

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/guide/contracts/${contractId}/send`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Gagal mengirim kontrak');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'guide', 'contracts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'guide', 'contracts', 'detail', contractId] });
      toast.success('Kontrak telah dikirim ke guide');
    },
    onError: (error) => {
      logger.error('Failed to send contract', error);
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim kontrak');
    },
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/guide/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_method: 'typed' }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Gagal menandatangani kontrak');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'guide', 'contracts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'guide', 'contracts', 'detail', contractId] });
      toast.success('Kontrak telah ditandatangani dan aktif');
    },
    onError: (error) => {
      logger.error('Failed to sign contract', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menandatangani kontrak');
    },
  });

  const terminateMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/admin/guide/contracts/${contractId}/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termination_reason: reason }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Gagal menghentikan kontrak');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'guide', 'contracts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'guide', 'contracts', 'detail', contractId] });
      setShowTerminateDialog(false);
      setTerminationReason('');
      toast.success('Kontrak telah dihentikan');
    },
    onError: (error) => {
      logger.error('Failed to terminate contract', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menghentikan kontrak');
    },
  });

  // Fetch sanctions
  const { data: sanctionsData, refetch: refetchSanctions } = useQuery<{ data: Array<unknown> }>({
    queryKey: ['admin', 'guide', 'contracts', 'sanctions', contractId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/guide/contracts/${contractId}/sanctions`);
      if (!res.ok) return { data: [] };
      return res.json();
    },
    enabled: !!contract,
  });

  const sanctions = sanctionsData?.data || [];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <LoadingState variant="spinner" message="Memuat detail kontrak..." />
        </CardContent>
      </Card>
    );
  }

  if (error || !contract) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <ErrorState
            message="Gagal memuat kontrak"
            onRetry={() => void refetch()}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  const isDraft = contract.status === 'draft';
  const isPendingSignature = contract.status === 'pending_signature';
  const isPendingCompany = contract.status === 'pending_company';
  const isActive = contract.status === 'active';
  const canSend = isDraft;
  const canSign = isPendingCompany;
  const canTerminate = isActive;

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
          <h1 className="text-2xl font-bold text-slate-900">Detail Kontrak</h1>
          <p className="text-sm text-slate-600">{contract.contract_number}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Detail</TabsTrigger>
          {isActive && <TabsTrigger value="sanctions">Sanksi ({sanctions.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="details">
          {/* Contract Info */}
          <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{contract.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium',
                contract.status === 'active' && 'bg-emerald-100 text-emerald-700',
                contract.status === 'pending_signature' && 'bg-amber-100 text-amber-700',
                contract.status === 'pending_company' && 'bg-blue-100 text-blue-700',
                contract.status === 'draft' && 'bg-slate-100 text-slate-700',
                contract.status === 'expired' && 'bg-slate-100 text-slate-600',
                contract.status === 'terminated' && 'bg-red-100 text-red-700',
                contract.status === 'rejected' && 'bg-red-100 text-red-700',
              )}
            >
              {contract.status === 'active' && 'Aktif'}
              {contract.status === 'pending_signature' && 'Menunggu Tanda Tangan Guide'}
              {contract.status === 'pending_company' && 'Menunggu Tanda Tangan Perusahaan'}
              {contract.status === 'draft' && 'Draft'}
              {contract.status === 'expired' && 'Kadaluarsa'}
              {contract.status === 'terminated' && 'Dihentikan'}
              {contract.status === 'rejected' && 'Ditolak'}
            </span>
          </div>

          {/* Guide Info */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Guide</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">Nama:</span>
                <p className="font-medium text-slate-900">
                  {contract.guide?.full_name || contract.guide?.email || '-'}
                </p>
              </div>
              {contract.guide?.email && (
                <div>
                  <span className="text-slate-500">Email:</span>
                  <p className="font-medium text-slate-900">{contract.guide.email}</p>
                </div>
              )}
              {contract.guide?.phone && (
                <div>
                  <span className="text-slate-500">Phone:</span>
                  <p className="font-medium text-slate-900">{contract.guide.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contract Details */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div>
              <span className="text-xs text-slate-500">Jenis Kontrak</span>
              <p className="font-medium text-slate-900">
                {contract.contract_type === 'per_trip' && 'Per Trip'}
                {contract.contract_type === 'monthly' && 'Bulanan'}
                {contract.contract_type === 'project' && 'Project'}
                {contract.contract_type === 'seasonal' && 'Musiman'}
                {contract.contract_type === 'annual' && 'Tahunan'}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Tanggal Mulai</span>
              <p className="font-medium text-slate-900">{formatDate(contract.start_date)}</p>
            </div>
            {contract.end_date && (
              <div>
                <span className="text-xs text-slate-500">Tanggal Berakhir</span>
                <p className="font-medium text-slate-900">{formatDate(contract.end_date)}</p>
              </div>
            )}
            <div>
              <span className="text-xs text-slate-500">Fee</span>
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(contract.fee_amount)}
              </p>
            </div>
            {contract.payment_terms && (
              <div>
                <span className="text-xs text-slate-500">Syarat Pembayaran</span>
                <p className="font-medium text-slate-900">{contract.payment_terms}</p>
              </div>
            )}
            {contract.description && (
              <div>
                <span className="text-xs text-slate-500">Deskripsi</span>
                <p className="font-medium text-slate-900">{contract.description}</p>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Status Tanda Tangan</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Tanda Tangan Guide</span>
                {contract.guide_signed_at ? (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs">
                      {new Date(contract.guide_signed_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-amber-600">Belum ditandatangani</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Tanda Tangan Perusahaan</span>
                {contract.company_signed_at ? (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs">
                      {new Date(contract.company_signed_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-amber-600">Belum ditandatangani</span>
                )}
              </div>
            </div>
          </div>

          {/* Signed PDF */}
          {contract.signed_pdf_url && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Dokumen</h3>
              <a
                href={contract.signed_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
              >
                <FileText className="h-4 w-4" />
                Download Kontrak yang Ditandatangani
              </a>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {isActive && (
          <TabsContent value="sanctions">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Sanksi</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setShowSanctionDialog(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Berikan Sanksi
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sanctions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Belum ada sanksi untuk kontrak ini
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sanctions.map((sanction: any) => (
                      <div
                        key={sanction.id}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-slate-900">{sanction.title}</h4>
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-xs font-medium',
                                  sanction.severity === 'critical' && 'bg-red-100 text-red-700',
                                  sanction.severity === 'high' && 'bg-orange-100 text-orange-700',
                                  sanction.severity === 'medium' && 'bg-amber-100 text-amber-700',
                                  sanction.severity === 'low' && 'bg-blue-100 text-blue-700',
                                )}
                              >
                                {sanction.severity === 'critical' && 'Kritis'}
                                {sanction.severity === 'high' && 'Tinggi'}
                                {sanction.severity === 'medium' && 'Sedang'}
                                {sanction.severity === 'low' && 'Rendah'}
                              </span>
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-xs font-medium',
                                  sanction.status === 'active' && 'bg-red-100 text-red-700',
                                  sanction.status === 'resolved' && 'bg-emerald-100 text-emerald-700',
                                )}
                              >
                                {sanction.status === 'active' && 'Aktif'}
                                {sanction.status === 'resolved' && 'Selesai'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{sanction.description}</p>
                            <div className="text-xs text-slate-500">
                              <p>
                                Tanggal: {new Date(sanction.violation_date).toLocaleDateString('id-ID')}
                              </p>
                              {sanction.fine_amount && (
                                <p>Denda: {formatCurrency(Number(sanction.fine_amount))}</p>
                              )}
                              {sanction.suspension_start_date && (
                                <p>
                                  Suspensi:{' '}
                                  {new Date(sanction.suspension_start_date).toLocaleDateString('id-ID')} -{' '}
                                  {sanction.suspension_end_date
                                    ? new Date(sanction.suspension_end_date).toLocaleDateString('id-ID')
                                    : 'Berlaku'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {canSend && (
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending}
          >
            {sendMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Kirim ke Guide
              </>
            )}
          </Button>
        )}
        {canSign && (
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => signMutation.mutate()}
            disabled={signMutation.isPending}
          >
            {signMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Tandatangani sebagai Perusahaan
              </>
            )}
          </Button>
        )}
        {isActive && (
          <Button
            variant="outline"
            onClick={() => {
              window.open(`/api/guide/contracts/${contractId}/pdf`, '_blank');
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        )}
        {canTerminate && (
          <Button
            variant="destructive"
            onClick={() => setShowTerminateDialog(true)}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Hentikan Kontrak
          </Button>
        )}
      </div>

      {/* Terminate Dialog */}
      <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hentikan Kontrak</DialogTitle>
            <DialogDescription>
              Berikan alasan penghentian kontrak ini (minimal 10 karakter)
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
              placeholder="Masukkan alasan penghentian..."
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="mt-2 text-xs text-slate-500">
              {terminationReason.length}/500 karakter
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTerminateDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={() => terminateMutation.mutate(terminationReason.trim())}
              disabled={terminationReason.trim().length < 10 || terminateMutation.isPending}
              variant="destructive"
            >
              {terminateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Hentikan Kontrak
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sanction Dialog */}
      <SanctionDialog
        open={showSanctionDialog}
        onOpenChange={setShowSanctionDialog}
        contractId={contractId}
        guideId={contract.guide_id}
        onSuccess={() => {
          void refetchSanctions();
          setActiveTab('sanctions');
        }}
      />
    </div>
  );
}

// Sanction Dialog Component
type SanctionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  guideId: string;
  onSuccess: () => void;
};

function SanctionDialog({
  open,
  onOpenChange,
  contractId,
  guideId,
  onSuccess,
}: SanctionDialogProps) {
  const queryClient = useQueryClient();
  const [sanctionType, setSanctionType] = useState<'warning' | 'suspension' | 'fine' | 'demotion' | 'termination'>('warning');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [violationDate, setViolationDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionTaken, setActionTaken] = useState('');
  const [fineAmount, setFineAmount] = useState('');
  const [suspensionStartDate, setSuspensionStartDate] = useState('');
  const [suspensionEndDate, setSuspensionEndDate] = useState('');

  const createSanctionMutation = useMutation({
    mutationFn: async (payload: {
      sanction_type: string;
      severity: string;
      title: string;
      description: string;
      violation_date: string;
      action_taken?: string;
      fine_amount?: number;
      suspension_start_date?: string;
      suspension_end_date?: string;
    }) => {
      const res = await fetch(`/api/admin/guide/contracts/${contractId}/sanctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Gagal memberikan sanksi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'guide', 'contracts', 'sanctions', contractId] });
      onOpenChange(false);
      resetForm();
      onSuccess();
      toast.success('Sanksi berhasil diberikan');
    },
    onError: (error) => {
      logger.error('Failed to create sanction', error);
      toast.error(error instanceof Error ? error.message : 'Gagal memberikan sanksi');
    },
  });

  const resetForm = () => {
    setSanctionType('warning');
    setSeverity('medium');
    setTitle('');
    setDescription('');
    setViolationDate(new Date().toISOString().split('T')[0]);
    setActionTaken('');
    setFineAmount('');
    setSuspensionStartDate('');
    setSuspensionEndDate('');
  };

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Judul dan deskripsi wajib diisi');
      return;
    }

    if (!violationDate) {
      toast.error('Tanggal pelanggaran wajib diisi');
      return;
    }

    const payload: {
      sanction_type: string;
      severity: string;
      title: string;
      description: string;
      violation_date: string;
      action_taken?: string;
      fine_amount?: number;
      suspension_start_date?: string;
      suspension_end_date?: string;
    } = {
      sanction_type: sanctionType,
      severity,
      title: title.trim(),
      description: description.trim(),
      violation_date: violationDate,
    };

    if (actionTaken.trim()) {
      payload.action_taken = actionTaken.trim();
    }

    if (sanctionType === 'fine' && fineAmount) {
      const amount = parseFloat(fineAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Jumlah denda tidak valid');
        return;
      }
      payload.fine_amount = amount;
    }

    if (sanctionType === 'suspension') {
      if (!suspensionStartDate || !suspensionEndDate) {
        toast.error('Tanggal suspensi wajib diisi');
        return;
      }
      payload.suspension_start_date = suspensionStartDate;
      payload.suspension_end_date = suspensionEndDate;
    }

    createSanctionMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Berikan Sanksi</DialogTitle>
          <DialogDescription>
            Berikan sanksi kepada guide untuk kontrak ini
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Jenis Sanksi *</Label>
            <select
              value={sanctionType}
              onChange={(e) => setSanctionType(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="warning">Peringatan</option>
              <option value="suspension">Suspensi</option>
              <option value="fine">Denda</option>
              <option value="demotion">Penurunan Level</option>
              <option value="termination">Penghentian Kontrak</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Tingkat Keparahan *</Label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="low">Rendah</option>
              <option value="medium">Sedang</option>
              <option value="high">Tinggi</option>
              <option value="critical">Kritis</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Judul *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Terlambat check-in"
            />
          </div>

          <div className="space-y-2">
            <Label>Deskripsi *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan pelanggaran yang dilakukan..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Tanggal Pelanggaran *</Label>
            <Input
              type="date"
              value={violationDate}
              onChange={(e) => setViolationDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tindakan yang Diambil</Label>
            <Textarea
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="Tindakan yang telah diambil..."
              className="min-h-[80px]"
            />
          </div>

          {sanctionType === 'fine' && (
            <div className="space-y-2">
              <Label>Jumlah Denda (Rp) *</Label>
              <Input
                type="number"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          )}

          {sanctionType === 'suspension' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai Suspensi *</Label>
                <Input
                  type="date"
                  value={suspensionStartDate}
                  onChange={(e) => setSuspensionStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Akhir Suspensi *</Label>
                <Input
                  type="date"
                  value={suspensionEndDate}
                  onChange={(e) => setSuspensionEndDate(e.target.value)}
                  min={suspensionStartDate}
                />
              </div>
            </div>
          )}

          {sanctionType === 'termination' && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-800">
                ⚠️ Peringatan: Sanksi ini akan secara otomatis menghentikan kontrak
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim() || createSanctionMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {createSanctionMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Berikan Sanksi
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
