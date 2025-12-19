/**
 * License Eligibility Client
 * Display eligibility status and requirements checklist
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    ExternalLink,
    FileCheck,
    FileText,
    GraduationCap,
    Heart,
    User,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type EligibilityData = {
  eligible: boolean;
  eligibility_percentage: number;
  requirements: Record<
    string,
    {
      met: boolean;
      message: string;
      data?: unknown;
    }
  >;
  requirements_summary: {
    met: number;
    total: number;
    missing: number;
  };
  recommendations: Array<{
    requirement: string;
    message: string;
    action_url: string;
  }>;
  has_license?: boolean;
  has_application?: boolean;
  license_id?: string;
  application_id?: string;
  application_status?: string;
  message?: string;
};

type LicenseEligibilityClientProps = {
  locale: string;
  onEligible?: () => void;
};

const requirementIcons: Record<string, typeof CheckCircle2> = {
  profile_complete: User,
  contract_signed: FileText,
  onboarding_complete: GraduationCap,
  emergency_contact: Heart,
  medical_info: Heart,
  bank_account: CreditCard,
  training_complete: GraduationCap,
  assessment_complete: FileCheck,
  documents_complete: FileText,
};

const requirementLabels: Record<string, string> = {
  profile_complete: 'Profil Lengkap',
  contract_signed: 'Kontrak Ditandatangani',
  onboarding_complete: 'Onboarding Selesai',
  emergency_contact: 'Kontak Darurat',
  medical_info: 'Informasi Medis',
  bank_account: 'Rekening Bank',
  training_complete: 'Training Wajib',
  assessment_complete: 'Assessment',
  documents_complete: 'Dokumen Wajib',
};

export function LicenseEligibilityClient({
  locale,
  onEligible,
}: LicenseEligibilityClientProps) {
  const { data, isLoading, error } = useQuery<EligibilityData>({
    queryKey: ['guide-license-eligibility'],
    queryFn: async () => {
      const res = await fetch('/api/guide/license/eligibility');
      if (!res.ok) throw new Error('Failed to check eligibility');
      return res.json();
    },
  });

  if (isLoading) {
    return <LoadingState message="Memeriksa kelayakan..." />;
  }

  if (error || !data) {
    return <ErrorState message="Gagal memeriksa kelayakan" />;
  }

  // If already has license
  if (data.has_license) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-600 p-2">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-emerald-900">License Aktif</CardTitle>
              <CardDescription className="text-emerald-700">
                {data.message || 'Anda sudah memiliki Guide License yang aktif'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-emerald-700">
            ID Card Anda sudah aktif dan dapat digunakan
          </p>
        </CardContent>
      </Card>
    );
  }

  // If has pending application
  if (data.has_application) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-600 p-2">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-blue-900">Aplikasi Sedang Diproses</CardTitle>
              <CardDescription className="text-blue-700">
                {data.message || 'Aplikasi Anda sedang dalam proses review'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Status:</span>
              <span className="font-medium capitalize">{data.application_status?.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-xs text-blue-600">
              Aplikasi Anda sedang diproses. ID Card akan tersedia setelah disetujui.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { requirements, requirements_summary, eligibility_percentage, eligible } = data;

  return (
    <div className="space-y-4">
      {/* Eligibility Status Card */}
      <Card className={cn(
        'shadow-lg transition-all duration-300',
        eligible 
          ? 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-emerald-100/50' 
          : 'border-amber-200/80 bg-gradient-to-br from-amber-50 to-amber-100/50'
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {eligible ? (
                <div className="rounded-full bg-emerald-600 p-2">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              ) : (
                <div className="rounded-full bg-amber-600 p-2">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <CardTitle className={cn(eligible ? 'text-emerald-900' : 'text-amber-900')}>
                  {eligible ? 'Eligible untuk License' : 'Belum Eligible'}
                </CardTitle>
                <CardDescription className={cn(eligible ? 'text-emerald-700' : 'text-amber-700')}>
                  {eligible
                    ? 'Semua requirements sudah terpenuhi. Anda bisa mengajukan license sekarang.'
                    : `Lengkapi ${requirements_summary.missing} requirement lagi untuk eligible`}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Progress Bar */}
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Progress Kelayakan</span>
                <span className="font-bold text-slate-900">{eligibility_percentage}%</span>
              </div>
              <Progress value={eligibility_percentage} className="h-2" />
              <p className="mt-1 text-xs text-slate-500">
                {requirements_summary.met} dari {requirements_summary.total} requirements terpenuhi
              </p>
            </div>

            {/* Requirements Checklist */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">Requirements Checklist:</p>
              {Object.entries(requirements).map(([key, req]) => {
                const Icon = requirementIcons[key] || CheckCircle2;
                const label = requirementLabels[key] || key;

                return (
                  <div
                    key={key}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border-2 p-4 shadow-sm transition-all duration-200',
                      req.met
                        ? 'border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-emerald-100/50'
                        : 'border-slate-200/80 bg-gradient-to-r from-slate-50 to-slate-100/50'
                    )}
                  >
                    {req.met ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    )}
                    <div className="flex-1">
                      <p className={cn('text-sm font-medium', req.met ? 'text-emerald-900' : 'text-slate-700')}>
                        {label}
                      </p>
                      <p className={cn('text-xs', req.met ? 'text-emerald-700' : 'text-slate-500')}>
                        {req.message}
                      </p>
                    </div>
                    {!req.met && data.recommendations.find((r) => r.requirement === key) && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/${locale}${data.recommendations.find((r) => r.requirement === key)?.action_url || ''}`}>
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Lengkapi
                        </Link>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Button */}
            {eligible && (
              <Button
                className="w-full"
                onClick={() => {
                  if (onEligible) {
                    onEligible();
                  }
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Ajukan Guide License
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
