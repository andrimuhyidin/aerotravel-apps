'use client';

/**
 * Trip Readiness Dialog
 * Menampilkan status kesiapan start trip (facility checklist, attendance, manifest, dll)
 */

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, ExternalLink, Package, ShieldCheck, UserCheck, Users, Wrench } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type TripReadinessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onOpenRiskAssessment?: () => void;
  tripId: string;
  locale: string;
};

type ReadinessStatus = {
  can_start: boolean;
  attendance_checked_in: boolean;
  facility_checklist: {
    complete: boolean;
    checked: number;
    total: number;
  };
  equipment_checklist: {
    complete: boolean;
    checked: number;
    total: number;
  };
  risk_assessment: {
    exists: boolean;
    safe: boolean;
  };
  certifications_valid: boolean;
  admin_approval_complete: boolean;
  manifest: {
    boarded: number;
    total: number;
    percentage: number;
  };
  reasons?: string[];
};

export function TripReadinessDialog({
  open,
  onOpenChange,
  onContinue,
  onOpenRiskAssessment,
  tripId,
  locale,
}: TripReadinessDialogProps) {
  const { data: readinessData, isLoading } = useQuery<ReadinessStatus>({
    queryKey: ['guide', 'trip-readiness', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/can-start`);
      if (!res.ok) {
        throw new Error('Failed to fetch readiness status');
      }
      return res.json();
    },
    enabled: open,
    refetchOnWindowFocus: true,
  });

  const canStart = readinessData?.can_start || false;
  const reasons = readinessData?.reasons || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Status Kesiapan Start Trip
          </DialogTitle>
          <DialogDescription>
            Pastikan semua persyaratan sudah terpenuhi sebelum memulai trip
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Memuat status kesiapan...
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* 1. Absensi */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                  readinessData?.attendance_checked_in
                    ? 'bg-emerald-100'
                    : 'bg-red-100'
                )}
              >
                {readinessData?.attendance_checked_in ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-slate-600" />
                    <p className="text-sm font-medium text-slate-900">Absensi</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={readinessData?.attendance_checked_in ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {readinessData?.attendance_checked_in ? 'Sudah Check-in' : 'Belum Check-in'}
                    </Badge>
                    {!readinessData?.attendance_checked_in && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        asChild
                      >
                        <Link href={`/${locale}/guide/attendance`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">
                  {readinessData?.attendance_checked_in
                    ? 'Guide sudah melakukan check-in'
                    : 'Guide belum melakukan absensi check-in'}
                </p>
              </div>
            </div>

            {/* 2. Fasilitas & Layanan */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                  readinessData?.facility_checklist.complete
                    ? 'bg-emerald-100'
                    : 'bg-red-100'
                )}
              >
                {readinessData?.facility_checklist.complete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-600" />
                    <p className="text-sm font-medium text-slate-900">Fasilitas & Layanan</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={readinessData?.facility_checklist.complete ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {readinessData?.facility_checklist.checked}/{readinessData?.facility_checklist.total}
                    </Badge>
                    {!readinessData?.facility_checklist.complete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          // Scroll to facility section in trip detail page
                          onOpenChange(false);
                          // Navigate with hash - facility section should have id="facility-checklist"
                          window.location.href = `/${locale}/guide/trips/${tripId}#facility-checklist`;
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">
                  {readinessData?.facility_checklist.complete
                    ? 'Semua fasilitas sudah diverifikasi'
                    : `${readinessData?.facility_checklist.checked || 0} dari ${
                        readinessData?.facility_checklist.total || 0
                      } fasilitas sudah diverifikasi`}
                </p>
                {readinessData?.facility_checklist.total && readinessData.facility_checklist.total > 0 && (
                  <Progress
                    value={
                      readinessData.facility_checklist.total > 0
                        ? ((readinessData.facility_checklist.checked || 0) /
                            readinessData.facility_checklist.total) *
                          100
                        : 0
                    }
                    className="mt-2 h-2"
                  />
                )}
              </div>
            </div>

            {/* 3. Equipment Checklist */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                  readinessData?.equipment_checklist.complete
                    ? 'bg-emerald-100'
                    : 'bg-red-100'
                )}
              >
                {readinessData?.equipment_checklist.complete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-slate-600" />
                    <p className="text-sm font-medium text-slate-900">Equipment Checklist</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={readinessData?.equipment_checklist.complete ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {readinessData?.equipment_checklist.checked || 0}/{readinessData?.equipment_checklist.total || 0}
                    </Badge>
                    {!readinessData?.equipment_checklist.complete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        asChild
                      >
                        <Link href={`/${locale}/guide/trips/${tripId}/equipment`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">
                  {readinessData?.equipment_checklist.complete
                    ? 'Semua equipment sudah di-check'
                    : `${readinessData?.equipment_checklist.checked || 0} dari ${
                        readinessData?.equipment_checklist.total || 0
                      } equipment sudah di-check`}
                </p>
                {(readinessData?.equipment_checklist.total || 0) > 0 && (
                  <Progress
                    value={
                      readinessData?.equipment_checklist.total
                        ? ((readinessData.equipment_checklist.checked || 0) /
                            readinessData.equipment_checklist.total) *
                          100
                        : 0
                    }
                    className="mt-2 h-2"
                  />
                )}
              </div>
            </div>

            {/* 4. Risk Assessment */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                  readinessData?.risk_assessment.exists
                    ? 'bg-emerald-100'
                    : 'bg-red-100'
                )}
              >
                {readinessData?.risk_assessment.exists ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">Risk Assessment</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={readinessData?.risk_assessment.exists ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {readinessData?.risk_assessment.exists ? 'Sudah' : 'Belum'}
                    </Badge>
                    {onOpenRiskAssessment ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          onOpenChange(false);
                          onOpenRiskAssessment();
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          onOpenChange(false);
                          onContinue();
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">
                  {readinessData?.risk_assessment.exists
                    ? 'Risk assessment sudah dilakukan'
                    : 'Risk assessment belum dilakukan'}
                </p>
              </div>
            </div>

            {/* 5. Certifications */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                  readinessData?.certifications_valid
                    ? 'bg-emerald-100'
                    : 'bg-red-100'
                )}
              >
                {readinessData?.certifications_valid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">Certifications</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={readinessData?.certifications_valid ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {readinessData?.certifications_valid ? 'Valid' : 'Tidak Valid'}
                    </Badge>
                    {!readinessData?.certifications_valid && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        asChild
                      >
                        <Link href={`/${locale}/guide/certifications`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">
                  {readinessData?.certifications_valid
                    ? 'Semua sertifikat masih berlaku'
                    : 'Ada sertifikat yang expired atau tidak valid'}
                </p>
              </div>
            </div>

            {/* 6. Manifest (Informational) */}
            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">Manifest Check-in</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {readinessData?.manifest.boarded || 0}/{readinessData?.manifest.total || 0} (
                      {readinessData?.manifest.percentage || 0}%)
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      asChild
                    >
                      <Link href={`/${locale}/guide/manifest?tripId=${tripId}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">
                  {readinessData?.manifest.total === 0
                    ? 'Belum ada data penumpang'
                    : `${readinessData?.manifest.boarded || 0} dari ${
                        readinessData?.manifest.total || 0
                      } peserta sudah check-in`}
                </p>
                {readinessData?.manifest.total && readinessData.manifest.total > 0 && (
                  <Progress
                    value={readinessData.manifest.percentage || 0}
                    className="mt-2 h-2"
                  />
                )}
              </div>
            </div>

            {/* Approval Admin Section */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-amber-900">
                      Approval Admin
                    </p>
                    <Badge
                      variant={readinessData?.admin_approval_complete ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {readinessData?.admin_approval_complete ? 'Sudah' : 'Belum'}
                    </Badge>
                  </div>
                  <p className="text-xs text-amber-700 mb-2">
                    {readinessData?.admin_approval_complete
                      ? 'Semua persyaratan sudah terpenuhi, trip dapat dimulai.'
                      : 'Beberapa persyaratan belum terpenuhi. Hubungi admin untuk konfirmasi sebelum memulai trip.'}
                  </p>
                  {!readinessData?.admin_approval_complete && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs w-full"
                      asChild
                    >
                      <a
                        href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                          `Halo Admin, saya perlu approval untuk memulai trip ${tripId}. Mohon dapat dicek dan disetujui. Terima kasih.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Hubungi Admin
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Error Messages */}
            {reasons.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-900">Trip belum bisa dimulai:</p>
                    <ul className="mt-1.5 space-y-1">
                      {reasons.map((reason, index) => (
                        <li key={index} className="text-xs text-red-700 list-disc list-inside">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {canStart && reasons.length === 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-900">
                      Semua persyaratan sudah terpenuhi
                    </p>
                    <p className="mt-0.5 text-xs text-emerald-700">
                      Trip siap untuk dimulai. Klik &quot;Lanjutkan&quot; untuk melakukan Risk Assessment.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Tutup
          </Button>
          <Button
            onClick={onContinue}
            disabled={!canStart || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Lanjutkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
