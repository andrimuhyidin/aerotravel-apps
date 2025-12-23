'use client';

/**
 * Document Verification Alert Component
 * Shows ID Card & Certification validity status before check-in
 */

import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Shield,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type DocumentVerificationAlertProps = {
  guideId: string;
  locale?: string;
};

type VerificationResult = {
  canCheckIn: boolean;
  idCard: {
    valid: boolean;
    expiringDays: number | null;
    cardNumber: string | null;
    validUntil: string | null;
    status: string | null;
  };
  certifications: {
    total: number;
    valid: number;
    expiring: number;
    expired: number;
    hasAllRequired: boolean;
    requiredTypes: string[];
    details: Array<{
      certification_type: string;
      certification_name: string;
      expiry_date: string;
      status: string;
    }>;
  };
  warnings: string[];
  blockers: string[];
};

export function DocumentVerificationAlert({
  guideId,
  locale = 'id',
}: DocumentVerificationAlertProps) {
  const { data, isLoading } = useQuery<VerificationResult>({
    queryKey: queryKeys.guide.attendance?.documentVerification?.(guideId) || [
      'attendance',
      'verify-documents',
      guideId,
    ],
    queryFn: async () => {
      const res = await fetch(
        `/api/guide/attendance/verify-documents?guideId=${guideId}`
      );
      if (!res.ok) throw new Error('Failed to verify documents');
      return res.json();
    },
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { canCheckIn, idCard, certifications, warnings, blockers } = data;

  return (
    <div className="space-y-3">
      {/* Blockers - Critical */}
      {blockers.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">Tidak Bisa Check-in</AlertTitle>
          <AlertDescription className="text-red-700">
            <ul className="mt-2 space-y-1 text-sm">
              {blockers.map((blocker, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{blocker}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
                asChild
              >
                <Link href={`/${locale}/guide/id-card`}>
                  <CreditCard className="mr-2 h-3 w-3" />
                  Kelola ID Card
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
                asChild
              >
                <Link href={`/${locale}/guide/certifications`}>
                  <Shield className="mr-2 h-3 w-3" />
                  Kelola Sertifikasi
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings - Important but not blocking */}
      {warnings.length > 0 && blockers.length === 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Peringatan Dokumen</AlertTitle>
          <AlertDescription className="text-amber-700">
            <ul className="mt-2 space-y-1 text-sm">
              {warnings.map((warning, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">
              Segera perbarui dokumen sebelum expired.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* All Clear */}
      {canCheckIn && warnings.length === 0 && blockers.length === 0 && (
        <Card className="border-0 bg-emerald-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900">
                  Dokumen Valid
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  ID Card dan sertifikasi Anda aktif. Siap untuk check-in!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Summary Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* ID Card Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard
                  className={cn(
                    'h-4 w-4',
                    idCard.valid ? 'text-emerald-600' : 'text-red-600'
                  )}
                />
                <span className="text-sm font-medium text-slate-900">
                  ID Card
                </span>
              </div>
              <div className="flex items-center gap-2">
                {idCard.valid ? (
                  <span className="text-xs text-emerald-600">✓ Valid</span>
                ) : (
                  <span className="text-xs text-red-600">✗ Invalid</span>
                )}
                {idCard.expiringDays !== null && idCard.expiringDays <= 30 && (
                  <span className="text-xs text-amber-600">
                    ({idCard.expiringDays} hari lagi)
                  </span>
                )}
              </div>
            </div>

            {/* Certifications Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield
                  className={cn(
                    'h-4 w-4',
                    certifications.hasAllRequired
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  )}
                />
                <span className="text-sm font-medium text-slate-900">
                  Sertifikasi
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs font-medium',
                    certifications.hasAllRequired
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  )}
                >
                  {certifications.valid}/{certifications.requiredTypes.length}{' '}
                  Required
                </span>
                {certifications.expiring > 0 && (
                  <span className="text-xs text-amber-600">
                    ({certifications.expiring} expiring)
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
