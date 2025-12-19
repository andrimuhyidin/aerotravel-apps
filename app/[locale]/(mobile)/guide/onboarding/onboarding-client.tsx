'use client';

/**
 * Onboarding Client Component
 * Progressive onboarding flow with step-by-step completion
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    CheckCircle,
    ChevronRight,
    Clock,
    FileText,
    GraduationCap,
    Play,
    Upload,
    User
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
// Progress component will be created inline or use existing
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type OnboardingClientProps = {
  locale: string;
};

type OnboardingStep = {
  id: string;
  step_order: number;
  step_type: string;
  title: string;
  description: string;
  instructions: string;
  is_required: boolean;
  estimated_minutes: number | null;
  resource_url: string | null;
  resource_type: string | null;
  validation_type: string;
};

type OnboardingProgress = {
  id: string;
  guide_id: string;
  current_step_id: string | null;
  started_at: string;
  completed_at: string | null;
  status: string;
  completion_percentage: number;
  current_step?: OnboardingStep;
};

type OnboardingData = {
  steps: OnboardingStep[];
  currentProgress: OnboardingProgress | null;
};

const getStepIcon = (stepType: string) => {
  switch (stepType) {
    case 'profile_setup':
      return User;
    case 'document':
      return Upload;
    case 'training':
      return GraduationCap;
    case 'assessment':
      return FileText;
    default:
      return CheckCircle;
  }
};

const getStepColor = (stepType: string) => {
  switch (stepType) {
    case 'profile_setup':
      return 'bg-blue-500';
    case 'document':
      return 'bg-purple-500';
    case 'training':
      return 'bg-emerald-500';
    case 'assessment':
      return 'bg-amber-500';
    default:
      return 'bg-slate-500';
  }
};

export function OnboardingClient({ locale }: OnboardingClientProps) {
  const queryClient = useQueryClient();
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  // Fetch onboarding data
  const { data, isLoading, error, refetch } = useQuery<OnboardingData>({
    queryKey: queryKeys.guide.onboarding.steps(),
    queryFn: async () => {
      const res = await fetch('/api/guide/onboarding/steps');
      if (!res.ok) throw new Error('Failed to load onboarding steps');
      return (await res.json()) as OnboardingData;
    },
  });

  // Start onboarding mutation
  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/guide/onboarding/progress', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to start onboarding');
      return (await res.json()) as { success: boolean; progressId: string };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.onboarding.steps() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.onboarding.progress() });
    },
  });

  // Complete step mutation
  const completeMutation = useMutation({
    mutationFn: async ({ stepId, completionData }: { stepId: string; completionData?: Record<string, unknown> }) => {
      const res = await fetch(`/api/guide/onboarding/steps/${stepId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionData }),
      });
      if (!res.ok) throw new Error('Failed to complete step');
      return (await res.json()) as { success: boolean; nextStepId?: string; completionPercentage: number };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.onboarding.steps() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.onboarding.progress() });
    },
  });

  // Get progress
  const { data: progressData } = useQuery<{
    progress: OnboardingProgress | null;
    completedSteps: string[];
  }>({
    queryKey: queryKeys.guide.onboarding.progress(),
    queryFn: async () => {
      const res = await fetch('/api/guide/onboarding/progress');
      if (!res.ok) throw new Error('Failed to load progress');
      return (await res.json()) as { progress: OnboardingProgress | null; completedSteps: string[] };
    },
  });

  const steps = data?.steps || [];
  const progress = progressData?.progress || data?.currentProgress || null;
  const completedSteps = progressData?.completedSteps || [];
  const completionPercentage = progress?.completion_percentage || 0;

  const handleStart = () => {
    startMutation.mutate();
  };

  const handleCompleteStep = (stepId: string) => {
    completeMutation.mutate({ stepId });
  };

  const handleStepClick = (step: OnboardingStep) => {
    if (step.step_type === 'profile_setup') {
      // Check if it's Guide License step
      if (step.title.toLowerCase().includes('guide license') || step.title.toLowerCase().includes('apply')) {
        window.location.href = `/${locale}/guide/id-card`;
        return;
      }
      // Check if it's Contract step
      if (step.title.toLowerCase().includes('kontrak') || step.title.toLowerCase().includes('contract')) {
        window.location.href = `/${locale}/guide/contracts`;
        return;
      }
      window.location.href = `/${locale}/guide/profile/edit`;
      return;
    }
    if (step.step_type === 'document') {
      // Redirect to documents page
      window.location.href = `/${locale}/guide/profile/edit#documents`;
      return;
    }
    setSelectedStep(step.id);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <LoadingState variant="skeleton" lines={4} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent>
          <ErrorState
            message={error instanceof Error ? error.message : 'Gagal memuat onboarding'}
            onRetry={() => void refetch()}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  // Not started yet
  if (!progress || progress.status === 'paused') {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-blue-50">
          <CardContent className="p-6">
            <div className="text-center">
              <GraduationCap className="mx-auto h-16 w-16 text-emerald-600 mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Selamat Datang!</h2>
              <p className="text-slate-600 mb-6">
                Mulai onboarding untuk mempersiapkan diri sebagai guide profesional
              </p>
              <Button onClick={handleStart} size="lg" className="w-full sm:w-auto">
                Mulai Onboarding
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Steps */}
        {steps.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <h3 className="text-lg font-semibold">Langkah-langkah Onboarding</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const Icon = getStepIcon(step.step_type);
                  const iconColor = getStepColor(step.step_type);
                  return (
                    <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg text-white', iconColor)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{step.title}</div>
                        {step.description && (
                          <div className="text-sm text-slate-600">{step.description}</div>
                        )}
                      </div>
                      {step.estimated_minutes && (
                        <div className="text-xs text-slate-500">
                          {step.estimated_minutes} menit
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Completed
  if (progress.status === 'completed') {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-emerald-600 mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Onboarding Selesai! 🎉</h2>
            <p className="text-slate-600 mb-6">
              Anda telah menyelesaikan semua langkah onboarding. Siap untuk memulai perjalanan sebagai guide!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/${locale}/guide/id-card`}>
                <Button size="lg" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                  <FileText className="mr-2 h-5 w-5" />
                  Apply Guide License
                </Button>
              </Link>
              <Link href={`/${locale}/guide`}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Kembali ke Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Guide License Info Card */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Langkah Selanjutnya: AeroTravel Guide License (ATGL)
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Untuk dapat menerima trip dan mulai bekerja sebagai guide, Anda perlu mendapatkan Guide License.
                  Pastikan semua persyaratan sudah terpenuhi:
                </p>
                <ul className="text-sm text-slate-600 space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Profil lengkap (Nama, Phone, NIK)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Kontrak ditandatangani</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Dokumen wajib terupload (KTP, SKCK, Surat Kesehatan, Foto)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Kontak darurat & informasi medis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Rekening bank (disetujui)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Training & Assessment selesai</span>
                  </li>
                </ul>
                <Link href={`/${locale}/guide/id-card`}>
                  <Button size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                    Cek Eligibility & Apply License
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // In progress
  const currentStepIndex = steps.findIndex((s) => s.id === progress.current_step_id);
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : steps[0];

  return (
    <div className="space-y-4 pb-6">
      {/* Progress Header */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Progress Onboarding</span>
              <span className="text-sm font-semibold text-slate-900">{completionPercentage}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-emerald-600 transition-all duration-300 ease-in-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600">
              {completedSteps.length} dari {steps.length} langkah selesai
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Highlight */}
      {currentStep && (
        <Card className="border-0 shadow-sm border-2 border-emerald-500 bg-emerald-50/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-white', getStepColor(currentStep.step_type))}>
                {(() => {
                  const Icon = getStepIcon(currentStep.step_type);
                  return <Icon className="h-6 w-6" />;
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{currentStep.title}</h3>
                  <Badge variant="default" className="bg-emerald-600">Langkah Saat Ini</Badge>
                </div>
                {currentStep.description && (
                  <p className="text-sm text-slate-600 mt-1">{currentStep.description}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentStep.instructions && (
              <div className="mb-4 p-4 rounded-lg bg-white">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{currentStep.instructions}</p>
              </div>
            )}
            <div className="flex gap-2">
              {currentStep.step_type === 'profile_setup' && (
                <Link href={`/${locale}/guide/profile/edit`} className="flex-1">
                  <Button className="w-full">Lengkapi Profil</Button>
                </Link>
              )}
              {currentStep.step_type === 'document' && (
                <Link href={`/${locale}/guide/profile/edit`} className="flex-1">
                  <Button className="w-full">Upload Dokumen</Button>
                </Link>
              )}
              {currentStep.step_type === 'training' && currentStep.resource_url && (
                <Button
                  className="flex-1"
                  onClick={() => window.open(currentStep.resource_url!, '_blank')}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Tonton Video
                </Button>
              )}
              {currentStep.step_type === 'assessment' && (
                <Link href={`/${locale}/guide/assessments`} className="flex-1">
                  <Button className="w-full">Mulai Assessment</Button>
                </Link>
              )}
              <Button
                variant="outline"
                onClick={() => handleCompleteStep(currentStep.id)}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? 'Menyimpan...' : 'Tandai Selesai'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Steps List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <h3 className="text-lg font-semibold">Semua Langkah</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = getStepIcon(step.step_type);
              const iconColor = getStepColor(step.step_type);
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = step.id === progress.current_step_id;
              const prevStep = index > 0 ? steps[index - 1] : null;
              const isLocked = !isCompleted && !isCurrent && index > 0 && prevStep && !completedSteps.includes(prevStep.id);

              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl border transition-all',
                    isCurrent && 'border-2 border-emerald-500 bg-emerald-50/50',
                    isCompleted && 'bg-slate-50 border-slate-200',
                    isLocked && 'opacity-50',
                    !isLocked && 'cursor-pointer hover:bg-slate-50',
                  )}
                  onClick={() => !isLocked && handleStepClick(step)}
                >
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg text-white', iconColor)}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{step.title}</span>
                      {isCompleted && (
                        <Badge variant="outline" className="text-xs">Selesai</Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="default" className="text-xs bg-emerald-600">Sedang</Badge>
                      )}
                      {isLocked && (
                        <Badge variant="outline" className="text-xs">Terkunci</Badge>
                      )}
                    </div>
                    {step.description && (
                      <div className="text-sm text-slate-600 mt-0.5">{step.description}</div>
                    )}
                    {step.estimated_minutes && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{step.estimated_minutes} menit</span>
                      </div>
                    )}
                  </div>
                  {!isLocked && (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
