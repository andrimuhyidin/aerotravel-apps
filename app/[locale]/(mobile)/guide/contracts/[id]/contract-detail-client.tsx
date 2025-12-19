'use client';

/**
 * Guide Contract Detail Client Component
 * View contract details, sign, reject, download PDF
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertTriangle,
    ArrowLeft,
    Ban,
    CheckCircle2,
    Download,
    FileText,
    Loader2,
    LogOut,
    XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { Textarea } from '@/components/ui/textarea';
import { formatContractContentForDisplay, generateDefaultContractContent } from '@/lib/guide/contract-template';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type ContractDetailClientProps = {
  locale: string;
  contractId: string;
  guideId: string;
};

type Contract = {
  id: string;
  contract_number: string;
  contract_type: 'annual'; // Only annual master contracts
  title: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  fee_amount: number | null; // Null for master contracts (fee in trip_guides)
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
  is_master_contract?: boolean;
  auto_cover_trips?: boolean;
  renewal_date?: string | null;
  trips?: Array<unknown>;
  payments?: Array<unknown>;
  guide?: {
    id: string;
    full_name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
};

type Sanction = {
  id: string;
  sanction_type: 'warning' | 'suspension' | 'fine' | 'demotion' | 'termination';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  violation_date: string;
  action_taken?: string | null;
  fine_amount?: number | null;
  suspension_start_date?: string | null;
  suspension_end_date?: string | null;
  status: 'active' | 'resolved' | 'cancelled';
  resolved_at?: string | null;
  resolution_notes?: string | null;
  issued_at: string;
  issued_by_user?: {
    id: string;
    full_name?: string;
  } | null;
};

export function ContractDetailClient({
  locale,
  contractId,
  guideId,
}: ContractDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showResignDialog, setShowResignDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [resignReason, setResignReason] = useState('');
  const [resignEffectiveDate, setResignEffectiveDate] = useState('');
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'upload' | 'typed'>('draw');
  const [signatureData, setSignatureData] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<{ contract: Contract }>({
    queryKey: queryKeys.guide.contracts.detail(contractId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/contracts/${contractId}`);
      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string; message?: string; code?: string };
        const errorMessage = errorData.message || errorData.error || 'Failed to load contract';
        throw new Error(errorMessage);
      }
      return res.json();
    },
    retry: 1,
  });

  const contract = data?.contract;

  const signMutation = useMutation({
    mutationFn: async (payload: { signature_data: string; signature_method: string }) => {
      const res = await fetch(`/api/guide/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string; message?: string; code?: string };
        const errorMessage = body.message || body.error || 'Gagal menandatangani kontrak';
        throw new Error(errorMessage);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.contracts.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.contracts.detail(contractId) });
      setShowSignDialog(false);
      setSignatureData('');
      toast.success(data.message || 'Kontrak berhasil ditandatangani');
    },
    onError: (error) => {
      logger.error('Failed to sign contract', error, { contractId });
      toast.error(error instanceof Error ? error.message : 'Gagal menandatangani kontrak');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/guide/contracts/${contractId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: reason }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string; message?: string; code?: string };
        const errorMessage = body.message || body.error || 'Gagal menolak kontrak';
        throw new Error(errorMessage);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.contracts.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.contracts.detail(contractId) });
      setShowRejectDialog(false);
      setRejectionReason('');
      toast.success(data.message || 'Kontrak telah ditolak');
    },
    onError: (error) => {
      logger.error('Failed to reject contract', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menolak kontrak');
    },
  });

  const resignMutation = useMutation({
    mutationFn: async (payload: { reason: string; effective_date: string; notice_period_days: number }) => {
      const res = await fetch(`/api/guide/contracts/${contractId}/resign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string; message?: string; code?: string };
        const errorMessage = body.message || body.error || 'Gagal mengajukan resign';
        throw new Error(errorMessage);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.contracts.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.contracts.detail(contractId) });
      setShowResignDialog(false);
      setResignReason('');
      setResignEffectiveDate('');
      toast.success(data.message || 'Pengajuan resign berhasil dikirim');
    },
    onError: (error) => {
      logger.error('Failed to submit resignation', error);
      toast.error(error instanceof Error ? error.message : 'Gagal mengajukan resign');
    },
  });

  // Fetch sanctions (optional - only if API exists)
  const { data: sanctionsData, isLoading: sanctionsLoading } = useQuery<{ data: Sanction[] }>({
    queryKey: queryKeys.guide.contracts.sanctions?.list?.(contractId) || ['contracts', contractId, 'sanctions'],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/guide/contracts/${contractId}/sanctions`);
        if (!res.ok) return { data: [] };
        return res.json();
      } catch {
        return { data: [] };
      }
    },
    enabled: !!contract,
    retry: false,
  });

  const sanctions = sanctionsData?.data || [];

  // Fetch resignations (optional - only if API exists)
  const { data: resignationData } = useQuery<{ data: Array<{ id: string; status: string; effective_date: string }> }>({
    queryKey: queryKeys.guide.contracts.resignations?.current?.(contractId) || ['contracts', contractId, 'resignations'],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/guide/contracts/${contractId}/resignations`);
        if (!res.ok) return { data: [] };
        return res.json();
      } catch {
        return { data: [] };
      }
    },
    enabled: !!contract && contract.status === 'active',
    retry: false,
  });

  const pendingResignation = resignationData?.data?.find((r) => r.status === 'pending');

  const handleSign = () => {
    if (!signatureData) {
      logger.warn('Signature data is empty');
      return;
    }

    signMutation.mutate({
      signature_data: signatureData,
      signature_method: signatureMethod,
    });
  };

  const handleReject = () => {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
      logger.warn('Rejection reason too short');
      return;
    }

    rejectMutation.mutate(rejectionReason.trim());
  };

  // Initialize canvas on mount
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  // Signature drawing handlers
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0]!.clientX - rect.left,
        y: e.touches[0]!.clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    return null;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    setSignatureData(canvas.toDataURL('image/png'));
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSignatureData(result);
    };
    reader.readAsDataURL(file);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) {
      return 'Fee per trip assignment';
    }
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <LoadingState variant="spinner" message="Memuat detail kontrak..." />
        </CardContent>
      </Card>
    );
  }

  if (error || !contract) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <ErrorState
            message="Gagal memuat kontrak"
            onRetry={() => void refetch()}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  const isPendingSignature = contract.status === 'pending_signature';
  const isActive = contract.status === 'active';
  const canSign = isPendingSignature && !contract.guide_signed_at;
  const canReject = isPendingSignature && !contract.guide_signed_at;
  const canResign = isActive && !pendingResignation;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/guide/contracts`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Detail Kontrak</h1>
          <p className="text-sm text-slate-600">{contract.contract_number}</p>
        </div>
      </div>

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
                contract.status === 'expired' && 'bg-slate-100 text-slate-600',
                contract.status === 'rejected' && 'bg-red-100 text-red-700',
              )}
            >
              {contract.status === 'active' && 'Aktif'}
              {contract.status === 'pending_signature' && 'Menunggu Tanda Tangan'}
              {contract.status === 'pending_company' && 'Menunggu Perusahaan'}
              {contract.status === 'expired' && 'Kadaluarsa'}
              {contract.status === 'rejected' && 'Ditolak'}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-500">Jenis Kontrak</span>
              <p className="font-medium text-slate-900">
                {contract.contract_type === 'annual' ? 'Tahunan' : contract.contract_type}
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
                {contract.fee_amount !== null && contract.fee_amount !== undefined
                  ? formatCurrency(contract.fee_amount)
                  : 'Fee per trip assignment (ditentukan saat trip assignment)'}
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

          {/* Full Contract Content */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-base font-semibold text-slate-900 mb-3">
              Isi Kontrak Lengkap
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 max-h-[600px] overflow-y-auto">
              <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                {(() => {
                  // Generate contract content from terms_and_conditions or use default template
                  try {
                    const terms = contract.terms_and_conditions as Record<string, unknown> | undefined;
                    const guideName = (contract.guide as { full_name?: string })?.full_name || 'Guide';
                    
                    // If terms_and_conditions has full content, use it
                    if (terms && typeof terms === 'object' && 'fullContent' in terms && typeof terms.fullContent === 'string') {
                      // Replace placeholder guide name if exists
                      return terms.fullContent.replace(/Guide/g, guideName);
                    }
                    
                    // Otherwise, generate from template
                    const guideInfo = contract.guide as { full_name?: string; email?: string; phone?: string; address?: string } | undefined;
                    const defaultContent = generateDefaultContractContent(
                      'PT Aero Travel Indonesia',
                      guideName,
                      contract.contract_number,
                      contract.start_date,
                      contract.end_date || '',
                      {
                        address: guideInfo?.address,
                        phone: guideInfo?.phone,
                        email: guideInfo?.email,
                      }
                    );
                    
                    // Merge with existing terms if available
                    if (terms) {
                      if (terms.employment_type) defaultContent.terms.employmentType = terms.employment_type as 'freelancer';
                      if (terms.fee_structure) defaultContent.compensation.feeStructure = terms.fee_structure as 'per_trip_assignment';
                      if (terms.exclusivity) defaultContent.terms.exclusivity = terms.exclusivity as string;
                      if (terms.nonCompete) defaultContent.terms.nonCompete = terms.nonCompete as string;
                      if (terms.confidentiality) defaultContent.terms.confidentiality = terms.confidentiality as string;
                      if (terms.intellectualProperty) defaultContent.terms.intellectualProperty = terms.intellectualProperty as string;
                      if (terms.termination) {
                        const termTermination = terms.termination as Record<string, unknown>;
                        if (termTermination.byCompany) defaultContent.terms.termination.byCompany = termTermination.byCompany as string;
                        if (termTermination.byGuide) defaultContent.terms.termination.byGuide = termTermination.byGuide as string;
                        if (termTermination.noticePeriod) defaultContent.terms.termination.noticePeriod = termTermination.noticePeriod as string;
                      }
                      if (terms.disputeResolution) defaultContent.terms.disputeResolution = terms.disputeResolution as string;
                      if (terms.governingLaw) defaultContent.terms.governingLaw = terms.governingLaw as string;
                    }
                    
                    return formatContractContentForDisplay(defaultContent);
                  } catch (error) {
                    logger.error('Failed to format contract content', error);
                    return 'Konten kontrak sedang dimuat...';
                  }
                })()}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              * Kontrak ini mengikuti standar best practices industry untuk kontrak kerja freelancer/independent contractor
            </p>
          </div>

          {/* Terms & Conditions (Legacy - for backward compatibility) */}
          {contract.terms_and_conditions &&
            Object.keys(contract.terms_and_conditions).length > 0 &&
            !('fullContent' in contract.terms_and_conditions) && (
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Detail Syarat dan Ketentuan
                </h3>
                <div className="space-y-2 text-sm text-slate-700">
                  {Object.entries(contract.terms_and_conditions).map(([key, value], index) => (
                    <div key={index}>
                      <span className="font-medium">{key}:</span>{' '}
                      {typeof value === 'string'
                        ? value
                        : Array.isArray(value)
                          ? value.join(', ')
                          : JSON.stringify(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                      {formatDate(contract.guide_signed_at)}
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
                      {formatDate(contract.company_signed_at)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-amber-600">Belum ditandatangani</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sanctions Section */}
      {isActive && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Sanksi
              {sanctions.length > 0 && (
                <span className="text-sm font-normal text-slate-500">
                  ({sanctions.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sanctionsLoading ? (
              <div className="py-4">
                <LoadingState variant="spinner" message="Memuat sanksi..." />
              </div>
            ) : sanctions.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Belum ada sanksi"
                description="Anda belum menerima sanksi untuk kontrak ini"
                variant="subtle"
              />
            ) : (
              <div className="space-y-3">
                {sanctions.map((sanction) => {
                  const sanctionTypeLabels: Record<string, string> = {
                    warning: 'Peringatan',
                    suspension: 'Suspensi',
                    fine: 'Denda',
                    demotion: 'Penurunan Level',
                    termination: 'Penghentian Kontrak',
                  };

                  const severityConfig: Record<
                    string,
                    { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
                  > = {
                    critical: {
                      label: 'Kritis',
                      color: 'bg-red-100 text-red-700',
                      icon: AlertTriangle,
                    },
                    high: {
                      label: 'Tinggi',
                      color: 'bg-orange-100 text-orange-700',
                      icon: AlertTriangle,
                    },
                    medium: {
                      label: 'Sedang',
                      color: 'bg-amber-100 text-amber-700',
                      icon: AlertTriangle,
                    },
                    low: {
                      label: 'Rendah',
                      color: 'bg-blue-100 text-blue-700',
                      icon: AlertTriangle,
                    },
                  };

                  const typeConfig: Record<
                    string,
                    { label: string; icon: React.ComponentType<{ className?: string }> }
                  > = {
                    warning: { label: 'Peringatan', icon: AlertTriangle },
                    suspension: { label: 'Suspensi', icon: Ban },
                    fine: { label: 'Denda', icon: FileText },
                    demotion: { label: 'Penurunan Level', icon: XCircle },
                    termination: { label: 'Penghentian', icon: Ban },
                  };

                  const severityKey = sanction.severity || 'medium';
                  const typeKey = sanction.sanction_type || 'warning';
                  const severity = severityConfig[severityKey] || severityConfig.medium;
                  const type = typeConfig[typeKey] || typeConfig.warning;
                  
                  if (!severity || !type) {
                    return null; // Skip if config not found
                  }
                  
                  const SeverityIcon = severity.icon;
                  const TypeIcon = type.icon;
                  const isResolved = sanction.status === 'resolved';

                  return (
                      <div
                        key={sanction.id}
                        className={cn(
                          'rounded-lg border p-4',
                          isResolved
                            ? 'border-slate-200 bg-slate-50'
                            : (sanction.severity || 'medium') === 'critical'
                              ? 'border-red-200 bg-red-50'
                              : (sanction.severity || 'medium') === 'high'
                                ? 'border-orange-200 bg-orange-50'
                                : 'border-amber-200 bg-amber-50'
                        )}
                      >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <TypeIcon className="h-4 w-4 text-slate-600" />
                            <h4 className="font-semibold text-slate-900">{sanction.title}</h4>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                severity.color
                              )}
                            >
                              <SeverityIcon className="inline h-3 w-3 mr-1" />
                              {severity.label}
                            </span>
                            <span className="text-xs text-slate-500">
                              {sanctionTypeLabels[sanction.sanction_type || 'warning']}
                            </span>
                            {isResolved && (
                              <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="inline h-3 w-3 mr-1" />
                                Resolved
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-slate-500">Deskripsi:</span>
                          <p className="font-medium text-slate-900 mt-0.5">{sanction.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Tanggal Pelanggaran:</span>
                            <p className="font-medium text-slate-900">
                              {sanction.violation_date ? formatDate(sanction.violation_date) : '-'}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Diterbitkan:</span>
                            <p className="font-medium text-slate-900">
                              {sanction.issued_at ? formatDate(sanction.issued_at) : '-'}
                            </p>
                          </div>
                        </div>

                        {sanction.fine_amount !== null && sanction.fine_amount !== undefined && sanction.fine_amount > 0 && (
                          <div>
                            <span className="text-slate-500">Jumlah Denda:</span>
                            <p className="font-semibold text-red-600">
                              {formatCurrency(sanction.fine_amount)}
                            </p>
                          </div>
                        )}

                        {sanction.suspension_start_date && sanction.suspension_end_date && (
                          <div>
                            <span className="text-slate-500">Periode Suspensi:</span>
                            <p className="font-medium text-slate-900">
                              {formatDate(sanction.suspension_start_date)} -{' '}
                              {formatDate(sanction.suspension_end_date)}
                            </p>
                          </div>
                        )}

                        {sanction.action_taken && (
                          <div>
                            <span className="text-slate-500">Tindakan yang Diambil:</span>
                            <p className="font-medium text-slate-900">{sanction.action_taken}</p>
                          </div>
                        )}

                        {isResolved && sanction.resolved_at && (
                          <div className="pt-2 border-t border-slate-200">
                            <div className="flex items-center gap-2 text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs font-medium">
                                Resolved pada {formatDate(sanction.resolved_at)}
                              </span>
                            </div>
                            {sanction.resolution_notes && (
                              <p className="text-xs text-slate-600 mt-1">
                                {sanction.resolution_notes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {canSign && (
          <Button
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            size="lg"
            onClick={() => setShowSignDialog(true)}
          >
            <FileText className="mr-2 h-5 w-5" />
            Tandatangani Kontrak
          </Button>
        )}
        {canReject && (
          <Button
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
            size="lg"
            onClick={() => setShowRejectDialog(true)}
          >
            <XCircle className="mr-2 h-5 w-5" />
            Tolak Kontrak
          </Button>
        )}
        {isActive && (
          <>
            {canResign && (
              <Button
                variant="outline"
                className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                size="lg"
                onClick={() => setShowResignDialog(true)}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Ajukan Resign
              </Button>
            )}
            {pendingResignation && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-800">
                  Pengajuan Resign Pending
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Tanggal efektif: {pendingResignation.effective_date ? formatDate(pendingResignation.effective_date) : '-'}
                </p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => {
                window.open(`/api/guide/contracts/${contractId}/pdf`, '_blank');
              }}
            >
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </Button>
          </>
        )}
      </div>

      {/* Sign Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tandatangani Kontrak</DialogTitle>
            <DialogDescription>
              Pilih metode tanda tangan dan lengkapi informasi berikut
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Method Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Metode Tanda Tangan</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={signatureMethod === 'draw' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSignatureMethod('draw')}
                >
                  Gambar
                </Button>
                <Button
                  type="button"
                  variant={signatureMethod === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSignatureMethod('upload')}
                >
                  Upload
                </Button>
                <Button
                  type="button"
                  variant={signatureMethod === 'typed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSignatureMethod('typed')}
                >
                  Ketik Nama
                </Button>
              </div>
            </div>

            {/* Signature Input */}
            {signatureMethod === 'draw' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Gambar Tanda Tangan</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-white">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    className="w-full border border-slate-200 rounded cursor-crosshair bg-white touch-none"
                    style={{ touchAction: 'none' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      startDrawing(e);
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      draw(e);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      stopDrawing();
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={clearSignature}>
                    Hapus
                  </Button>
                  {signatureData && (
                    <p className="text-xs text-emerald-600">✓ Tanda tangan telah dibuat</p>
                  )}
                </div>
              </div>
            )}

            {signatureMethod === 'upload' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Tanda Tangan</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-sm"
                />
                {signatureData && (
                  <img src={signatureData} alt="Signature preview" className="max-w-full h-32 object-contain border rounded" />
                )}
              </div>
            )}

            {signatureMethod === 'typed' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Ketik Nama Lengkap</label>
                <input
                  type="text"
                  value={signatureData}
                  onChange={(e) => setSignatureData(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSign}
              disabled={!signatureData || signMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {signMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Tandatangani
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
            <DialogTitle>Tolak Kontrak</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan kontrak ini (minimal 10 karakter)
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Masukkan alasan penolakan..."
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="mt-2 text-xs text-slate-500">
              {rejectionReason.length}/500 karakter
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleReject}
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
                  Tolak Kontrak
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resign Dialog */}
      <Dialog open={showResignDialog} onOpenChange={setShowResignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajukan Resign</DialogTitle>
            <DialogDescription>
              Ajukan resign untuk kontrak ini. Pengajuan akan ditinjau oleh admin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Alasan Resign *</label>
              <Textarea
                value={resignReason}
                onChange={(e) => setResignReason(e.target.value)}
                placeholder="Masukkan alasan resign (minimal 10 karakter)..."
                className="min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-slate-500">
                {resignReason.length}/500 karakter
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Efektif *</label>
              <Input
                type="date"
                value={resignEffectiveDate}
                onChange={(e) => setResignEffectiveDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-slate-500">
                Tanggal efektif resign (minimal hari ini)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResignDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                if (!resignReason.trim() || resignReason.trim().length < 10) {
                  toast.error('Alasan resign minimal 10 karakter');
                  return;
                }
                if (!resignEffectiveDate) {
                  toast.error('Tanggal efektif wajib diisi');
                  return;
                }
                resignMutation.mutate({
                  reason: resignReason.trim(),
                  effective_date: resignEffectiveDate,
                  notice_period_days: 14,
                });
              }}
              disabled={resignReason.trim().length < 10 || !resignEffectiveDate || resignMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {resignMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Ajukan Resign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
