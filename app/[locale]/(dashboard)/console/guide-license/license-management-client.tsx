/**
 * License Management Client
 * Admin dashboard untuk manage license applications
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Download, FileText, XCircle } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import queryKeys from '@/lib/queries/query-keys';
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
    };
  };
  documents?: Record<string, { url?: string; verified?: boolean }>;
  created_at: string;
  guide?: {
    full_name?: string;
    email?: string;
  };
};

type LicenseManagementClientProps = {
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

export function LicenseManagementClient({ locale }: LicenseManagementClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showIssueDialog, setShowIssueDialog] = useState(false);

  const queryClient = useQueryClient();

  // Fetch applications
  const { data, isLoading, error } = useQuery<{
    applications: Application[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: queryKeys.admin.licenses.applications({ status: statusFilter }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`/api/admin/guide/license/applications?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch applications');
      return res.json();
    },
  });

  // Issue license mutation
  const issueLicense = useMutation({
    mutationFn: async (applicationId: string) => {
      const res = await fetch(`/api/admin/guide/license/applications/${applicationId}/issue-license`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to issue license');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.licenses.all() });
      toast.success('License berhasil diterbitkan');
      setShowIssueDialog(false);
      setSelectedApp(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menerbitkan license');
    },
  });

  if (isLoading) {
    return <LoadingState message="Memuat aplikasi..." />;
  }

  if (error) {
    return <ErrorState message="Gagal memuat aplikasi" />;
  }

  const applications = data?.applications || [];

  const handleIssueLicense = (app: Application) => {
    setSelectedApp(app);
    setShowIssueDialog(true);
  };

  const handleConfirmIssue = () => {
    if (!selectedApp) return;
    issueLicense.mutate(selectedApp.id);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending_review">Menunggu Review</SelectItem>
            <SelectItem value="document_verified">Dokumen Terverifikasi</SelectItem>
            <SelectItem value="assessment_passed">Assessment Lulus</SelectItem>
            <SelectItem value="training_completed">Training Selesai</SelectItem>
            <SelectItem value="pending_approval">Menunggu Approval</SelectItem>
            <SelectItem value="approved">Disetujui</SelectItem>
            <SelectItem value="license_issued">License Terbit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm text-slate-500">Tidak ada aplikasi</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const statusInfo = statusLabels[app.status] || statusLabels.pending_review;
            const StatusIcon = statusInfo?.icon || FileText;

            const allDocsVerified = app.documents
              ? ['ktp', 'skck', 'medical', 'photo'].every(
                  (doc) => app.documents?.[doc]?.verified === true
                )
              : false;

            return (
              <Card key={app.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {app.application_data.personal_info.full_name}
                      </CardTitle>
                      <p className="mt-1 text-xs text-slate-500">
                        {app.application_number} • {app.guide?.email || 'N/A'}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                        statusInfo?.className || 'bg-slate-100 text-slate-700'
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo?.label || app.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">NIK:</span>
                      <span className="font-medium">{app.application_data.personal_info.nik}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-medium">
                        {app.application_data.personal_info.phone}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Stage:</span>
                      <span className="font-medium">{app.current_stage}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Documents:</span>
                      <span
                        className={cn(
                          'font-medium',
                          allDocsVerified ? 'text-emerald-600' : 'text-yellow-600'
                        )}
                      >
                        {allDocsVerified ? '✓ Verified' : '⚠ Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {app.status === 'approved' && (
                      <Button size="sm" onClick={() => handleIssueLicense(app)}>
                        <Download className="mr-2 h-4 w-4" />
                        Terbitkan License
                      </Button>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/${locale}/console/guide-license/${app.id}`}>Detail</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Issue License Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terbitkan Guide License</DialogTitle>
            <DialogDescription>
              Pastikan semua dokumen sudah terverifikasi dan aplikasi sudah disetujui
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700">Guide:</p>
                <p className="text-sm text-slate-600">
                  {selectedApp.application_data.personal_info.full_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Application Number:</p>
                <p className="text-sm text-slate-600">{selectedApp.application_number}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3">
                <p className="text-xs text-amber-800">
                  ⚠️ License akan diterbitkan dengan masa berlaku 2 tahun dari tanggal terbit
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIssueDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleConfirmIssue} disabled={issueLicense.isPending}>
              {issueLicense.isPending ? 'Menerbitkan...' : 'Terbitkan License'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
