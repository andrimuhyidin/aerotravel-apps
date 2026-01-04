/**
 * Training Module Detail Client Component
 * Display training module content or redirect if not found
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Play,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import queryKeys from '@/lib/queries/query-keys';
import { CompetencyQuiz } from '@/components/guide/competency-quiz';
import { TrainerFeedbackForm } from '@/components/guide/trainer-feedback-form';

type TrainingModule = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  content?: string;
  progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    progress_percent: number;
  };
};

type TrainingModuleDetailClientProps = {
  locale: string;
  moduleId: string;
};

export function TrainingModuleDetailClient({
  locale,
  moduleId,
}: TrainingModuleDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'feedback'>(
    'content'
  );

  // Fetch all modules to find the one we need
  const { data, isLoading, error } = useQuery<{ modules: TrainingModule[] }>({
    queryKey: [...queryKeys.guide.all, 'training', 'modules'],
    queryFn: async () => {
      const res = await fetch('/api/guide/training/modules');
      if (!res.ok) throw new Error('Failed to fetch training modules');
      return res.json();
    },
    staleTime: 60000,
  });

  // Fetch quiz for this training module
  const { data: quizData } = useQuery<{ quizId: string }>({
    queryKey: [...queryKeys.guide.all, 'training', 'quiz', moduleId],
    queryFn: async () => {
      const res = await fetch(`/api/guide/training/modules/${moduleId}/quiz`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!moduleId,
  });

  if (isLoading) {
    return (
      <LoadingState
        variant="skeleton-card"
        lines={5}
        message="Memuat modul training..."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Gagal memuat modul training"
        onRetry={() => router.push(`/${locale}/guide/learning`)}
        variant="card"
      />
    );
  }

  const module = data?.modules?.find((m) => m?.id === moduleId);

  if (!module || !module.id) {
    return (
      <div className="space-y-4">
        <Link href={`/${locale}/guide/learning`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Learning Hub
          </Button>
        </Link>
        <EmptyState
          icon={BookOpen}
          title="Modul tidak ditemukan"
          description="Modul training yang Anda cari tidak tersedia"
          variant="default"
        />
      </div>
    );
  }

  const moduleTitle = module.title || 'Training Module';
  const moduleDescription = module.description || '';
  const durationMinutes = module.duration_minutes ?? 0;
  const moduleContent = module.content || '';
  const progress = module.progress;
  const progressPercent = progress?.progress_percent ?? 0;
  const isCompleted = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Link href={`/${locale}/guide/learning`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Learning Hub
        </Button>
      </Link>

      {/* Module Header */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{moduleTitle}</CardTitle>
              {moduleDescription && (
                <p className="mt-2 text-sm text-slate-600">
                  {moduleDescription}
                </p>
              )}
            </div>
            {isCompleted && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Duration */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4" />
            <span>Durasi: {durationMinutes} menit</span>
          </div>

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Progress</span>
                <span className="font-medium text-slate-900">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-emerald-600">Selesai</span>
                  </>
                ) : isInProgress ? (
                  <>
                    <Play className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-600">
                      Sedang dikerjakan
                    </span>
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      Belum dimulai
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tabs for Content, Quiz, and Feedback */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="mt-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Konten</TabsTrigger>
              <TabsTrigger
                value="quiz"
                className={cn(
                  'flex items-center gap-2',
                  !quizData?.quizId && 'pointer-events-none opacity-50'
                )}
              >
                <GraduationCap className="h-4 w-4" />
                <span>Quiz</span>
              </TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4">
              {/* Content */}
              {moduleContent ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Konten Training
                  </h3>
                  <div
                    className="prose prose-sm max-w-none text-slate-700"
                    dangerouslySetInnerHTML={{ __html: moduleContent }}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">
                    Konten training sedang dalam pengembangan. Silakan kembali
                    lagi nanti.
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-4">
                {isCompleted ? (
                  <Button variant="outline" className="w-full" disabled>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Training Selesai
                  </Button>
                ) : (
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Play className="mr-2 h-4 w-4" />
                    {isInProgress ? 'Lanjutkan Training' : 'Mulai Training'}
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="quiz" className="mt-4">
              {quizData?.quizId ? (
                <CompetencyQuiz
                  quizId={quizData.quizId}
                  onComplete={(passed, score) => {
                    if (passed) {
                      toast.success(`Quiz passed! Score: ${score}%`);
                    } else {
                      toast.error(`Quiz failed. Score: ${score}%`);
                    }
                  }}
                />
              ) : (
                <EmptyState
                  icon={GraduationCap}
                  title="Quiz tidak tersedia"
                  description="Quiz untuk training ini belum tersedia"
                  variant="default"
                />
              )}
            </TabsContent>

            <TabsContent value="feedback" className="mt-4">
              <TrainerFeedbackForm
                trainingId={moduleId}
                onComplete={() => {
                  toast.success('Feedback berhasil dikirim');
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
