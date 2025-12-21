/**
 * Training Module Detail Client Component
 * Display training module content or redirect if not found
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Play } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Progress } from '@/components/ui/progress';
import queryKeys from '@/lib/queries/query-keys';

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

  if (isLoading) {
    return <LoadingState variant="skeleton-card" lines={5} message="Memuat modul training..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Gagal memuat modul training"
        onRetry={() => router.push(`/${locale}/guide/training`)}
        variant="card"
      />
    );
  }

  const module = data?.modules.find((m) => m.id === moduleId);

  if (!module) {
    return (
      <div className="space-y-4">
        <Link href={`/${locale}/guide/training`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Training
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

  const progress = module.progress;
  const isCompleted = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Link href={`/${locale}/guide/training`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Training
        </Button>
      </Link>

      {/* Module Header */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{module.title}</CardTitle>
              <p className="mt-2 text-sm text-slate-600">{module.description}</p>
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
            <span>Durasi: {module.duration_minutes} menit</span>
          </div>

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Progress</span>
                <span className="font-medium text-slate-900">
                  {Math.round(progress.progress_percent)}%
                </span>
              </div>
              <Progress value={progress.progress_percent} className="h-2" />
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-emerald-600">Selesai</span>
                  </>
                ) : isInProgress ? (
                  <>
                    <Play className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-600">Sedang dikerjakan</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Belum dimulai</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          {module.content ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-2 font-semibold text-slate-900">Konten Training</h3>
              <div
                className="prose prose-sm max-w-none text-slate-700"
                dangerouslySetInnerHTML={{ __html: module.content }}
              />
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                Konten training sedang dalam pengembangan. Silakan kembali lagi nanti.
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
        </CardContent>
      </Card>
    </div>
  );
}

