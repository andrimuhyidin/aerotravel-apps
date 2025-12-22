/**
 * Training Client Component
 * Display training modules and progress
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, Clock, Play } from 'lucide-react';
import Link from 'next/link';

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
  progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    progress_percent: number;
  };
};

type TrainingResponse = {
  modules: TrainingModule[];
};

type TrainingClientProps = {
  locale: string;
};

export function TrainingClient({ locale }: TrainingClientProps) {
  const { data, isLoading, error, refetch } = useQuery<TrainingResponse>({
    queryKey: [...queryKeys.guide.all, 'training', 'modules'],
    queryFn: async () => {
      const res = await fetch('/api/guide/training/modules');
      if (!res.ok) throw new Error('Failed to fetch training modules');
      return res.json();
    },
    staleTime: 60000,
  });

  if (isLoading) {
    return <LoadingState variant="skeleton-card" lines={3} message="Memuat modul training..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Gagal memuat modul training'}
        onRetry={() => void refetch()}
        variant="card"
      />
    );
  }

  const modules = data?.modules || [];

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'in_progress':
        return <Play className="h-5 w-5 text-blue-500" />;
      default:
        return <BookOpen className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Selesai';
      case 'in_progress':
        return 'Sedang Dikerjakan';
      default:
        return 'Belum Dimulai';
    }
  };

  return (
    <div className="space-y-4">
      {modules.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Belum ada modul training"
          description="Modul training akan muncul di sini setelah tersedia"
        />
      ) : (
        modules.map((module) => {
          if (!module || !module.id) return null;
          const moduleTitle = module.title || 'Training Module';
          const moduleDescription = module.description || '';
          const durationMinutes = module.duration_minutes ?? 0;
          const progressStatus = module.progress?.status;
          const progressPercent = module.progress?.progress_percent ?? 0;
          
          return (
            <Card key={module.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{moduleTitle}</CardTitle>
                    {moduleDescription && (
                      <p className="mt-1 text-sm text-slate-600">{moduleDescription}</p>
                    )}
                  </div>
                  {getStatusIcon(progressStatus)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="h-4 w-4" />
                      <span>{durationMinutes} menit</span>
                    </div>
                    <span className="text-slate-500">
                      {getStatusLabel(progressStatus)}
                    </span>
                  </div>
                  {progressStatus === 'in_progress' && (
                    <div>
                      <Progress value={progressPercent} className="h-2" />
                      <div className="mt-1 text-xs text-slate-500">
                        {Math.round(progressPercent)}% selesai
                      </div>
                    </div>
                  )}
                  <Link
                    href={`/${locale}/guide/training/${module.id}`}
                    className="block"
                  >
                    <button className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                      {progressStatus === 'completed' ? 'Lihat Ulang' : 'Mulai Training'}
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

