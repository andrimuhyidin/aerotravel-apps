/**
 * License Application Detail Client
 * Admin view untuk detail aplikasi dan manage workflow
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Download,
    FileText,
    XCircle
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
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Application = {
  id: string;
  application_number: string;
  guide_id: string;
  status: string;
  current_stage: string;
  application_data: {
    personal_info: {
      full_name: string;
      nik: string;
      phone: string;
      email: string;
      address?: string;
    };
    documents: Record<string, { url?: string; verified?: boolean }>;
    experience: {
      previous_experience?: string;
      languages?: string[];
      specializations?: string[];
    };
  };
  documents?: Record<string, { url?: string; verified?: boolean }>;
  created_at: string;
  guide?: {
    full_name?: string;
    email?: string;
  };
};

type LicenseApplicationDetailClientProps = {
  applicationId: string;
  locale: string;
};

const statusLabels: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  pending_review: { label: 'Menunggu Review', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
  document_verified: { label: 'Dokumen Terverifikasi', className: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  document_rejected: { label: 'Dokumen Ditolak', className: 'bg-red-100 text-red-700', icon: XCircle },
  ready_for_assessment: { label: 'Siap Assessment', className: 'bg-purple-100 text-purple-700', icon: FileText },
  assessment_passed: { label: 'Assessment Lulus', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  training_completed: { label: 'Training Selesai', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  pending_approval: { label: 'Menunggu Approval', className: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Disetujui', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700', icon: XCircle },
  license_issued: { label: 'License Terbit', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
};

export function LicenseApplicationDetailClient({
  applicationId,
  locale,
}: LicenseApplicationDetailClientProps) {
  const queryClient = useQueryClient();
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'rejected'>('verified');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch application
  const { data, isLoading, error } = useQuery<{ application: Application }>({
    queryKey: ['admin-license-application', applicationId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/guide/license/applications?status=all`);
      if (!res.ok) throw new Error('Failed to fetch application');
      const data = await res.json();
      const app = data.applications.find((a: Application) => a.id === applicationId);
      if (!app) throw new Error('Application not found');
      return { application: app };
    },
  });

  // Verify document mutation
  const verifyDocument = useMutation({
    mutationFn: async ({
      docType,
      status,
      notes,
    }: {
      docType: string;
      status: 'verified' | 'rejected';
      notes?: string;
    }) => {
      const res = await fetch(
        `/api/admin/guide/license/applications/${applicationId}/verify-documents`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_type: docType,
            verification_status: status,
            verification_notes: notes,
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to verify document');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-license-application', applicationId] });
      toast.success('Dokumen berhasil diverifikasi');
      setShowVerifyDialog(false);
      setSelectedDoc('');
      setVerificationNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal verifikasi dokumen');
    },
  });

  // Approve mutation
  const approveApplication = useMutation({
    mutationFn: async (notes?: string) => {
      const res = await fetch(
        `/api/admin/guide/license/applications/${applicationId}/approve`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approval_notes: notes }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to approve application');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-license-application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['admin-license-applications'] });
      toast.success('Aplikasi berhasil disetujui');
      setShowApproveDialog(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menyetujui aplikasi');
    },
  });

  // Reject mutation
  const rejectApplication = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(
        `/api/admin/guide/license/applications/${applicationId}/reject`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rejection_reason: reason }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to reject application');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-license-application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['admin-license-applications'] });
      toast.success('Aplikasi ditolak');
      setShowRejectDialog(false);
      setRejectionReason('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menolak aplikasi');
    },
  });

  // Issue license mutation
  const issueLicense = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/admin/guide/license/applications/${applicationId}/issue-license`,
        {
          method: 'POST',
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to issue license');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-license-application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['admin-license-applications'] });
      toast.success('License berhasil diterbitkan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menerbitkan license');
    },
  });

  if (isLoading) {
    return <LoadingState message="Memuat aplikasi..." />;
  }

  if (error || !data) {
    return <ErrorState message="Gagal memuat aplikasi" />;
  }

  const { application } = data;
  const statusInfo = statusLabels[application.status] || statusLabels.pending_review;
  const StatusIcon = statusInfo?.icon || FileText;

  const documents = application.documents || application.application_data.documents || {};
  const requiredDocs = ['ktp', 'skck', 'medical', 'photo'];
  const allDocsVerified = requiredDocs.every((doc) => documents[doc]?.verified === true);

  const canApprove =
    application.status === 'training_completed' || application.status === 'pending_approval';
  const canIssue = application.status === 'approved';

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-slate-900">
            Detail Aplikasi License
          </h1>
          <p className="mt-1 text-sm text-slate-600">{application.application_number}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${locale}/console/guide-license`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status Aplikasi</CardTitle>
            <span
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                statusInfo?.className || 'bg-slate-100 text-slate-700'
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {statusInfo?.label || application.status}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Current Stage:</span>
              <span className="font-medium">{application.current_stage}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Guide:</span>
              <span className="font-medium">
                {application.guide?.full_name || application.guide?.email || 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pribadi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Nama Lengkap</p>
              <p className="text-sm font-medium">
                {application.application_data.personal_info.full_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">NIK</p>
              <p className="text-sm font-medium">
                {application.application_data.personal_info.nik}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-sm font-medium">
                {application.application_data.personal_info.phone}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-medium">
                {application.application_data.personal_info.email}
              </p>
            </div>
          </div>
          {application.application_data.personal_info.address && (
            <div>
              <p className="text-xs text-slate-500">Alamat</p>
              <p className="text-sm font-medium">
                {application.application_data.personal_info.address}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requiredDocs.map((docType) => {
            const doc = documents[docType];
            const isVerified = doc?.verified === true;
            const docLabels: Record<string, string> = {
              ktp: 'KTP',
              skck: 'SKCK',
              medical: 'Surat Kesehatan',
              photo: 'Foto Formal',
            };

            return (
              <div key={docType} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium">{docLabels[docType] || docType}</p>
                    {doc?.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 hover:underline"
                      >
                        Lihat dokumen
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isVerified ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-yellow-600">
                      <Clock className="h-4 w-4" />
                      Pending
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedDoc(docType);
                      setVerificationStatus(isVerified ? 'verified' : 'verified');
                      setShowVerifyDialog(true);
                    }}
                  >
                    {isVerified ? 'Edit' : 'Verify'}
                  </Button>
                </div>
              </div>
            );
          })}

          {allDocsVerified && (
            <div className="mt-4 rounded-lg bg-emerald-50 p-3">
              <p className="text-sm font-medium text-emerald-900">
                ✓ Semua dokumen sudah terverifikasi
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Experience */}
      {application.application_data.experience.previous_experience && (
        <Card>
          <CardHeader>
            <CardTitle>Pengalaman</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              {application.application_data.experience.previous_experience}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {canApprove && (
              <Button onClick={() => setShowApproveDialog(true)}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve Application
              </Button>
            )}
            {canIssue && (
              <Button onClick={() => issueLicense.mutate()} disabled={issueLicense.isPending}>
                <Download className="mr-2 h-4 w-4" />
                {issueLicense.isPending ? 'Menerbitkan...' : 'Terbitkan License'}
              </Button>
            )}
            {application.status !== 'rejected' && application.status !== 'license_issued' && (
              <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verify Document Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Document</DialogTitle>
            <DialogDescription>
              Verifikasi dokumen: {selectedDoc.toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Verification Status</Label>
              <RadioGroup
                value={verificationStatus}
                onValueChange={(value) => setVerificationStatus(value as 'verified' | 'rejected')}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="verified" id="verified" />
                  <Label htmlFor="verified" className="cursor-pointer">
                    Verified
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rejected" id="rejected" />
                  <Label htmlFor="rejected" className="cursor-pointer">
                    Rejected
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                className="mt-1"
                rows={3}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Catatan verifikasi..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                verifyDocument.mutate({
                  docType: selectedDoc,
                  status: verificationStatus,
                  notes: verificationNotes,
                });
              }}
              disabled={verifyDocument.isPending}
            >
              {verifyDocument.isPending ? 'Memverifikasi...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
            <DialogDescription>
              Setujui aplikasi untuk menerbitkan Guide License
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                ⚠️ Pastikan semua dokumen sudah terverifikasi dan training sudah selesai
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={() => approveApplication.mutate(undefined)}
              disabled={approveApplication.isPending}
            >
              {approveApplication.isPending ? 'Menyetujui...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>Tolak aplikasi dengan alasan</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Alasan Penolakan *</Label>
              <Textarea
                className="mt-1"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Jelaskan alasan penolakan..."
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!rejectionReason.trim()) {
                  toast.error('Alasan penolakan wajib diisi');
                  return;
                }
                rejectApplication.mutate(rejectionReason);
              }}
              disabled={rejectApplication.isPending || !rejectionReason.trim()}
            >
              {rejectApplication.isPending ? 'Menolak...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
