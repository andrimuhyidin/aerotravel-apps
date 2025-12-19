/**
 * Training Client Component
 * Display training modules and progress
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, Clock, Play } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
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
  const { data, isLoading } = useQuery<TrainingResponse>({
    queryKey: [...queryKeys.guide.all, 'training', 'modules'],
    queryFn: async () => {
      const res = await fetch('/api/guide/training/modules');
      if (!res.ok) throw new Error('Failed to fetch training modules');
      return res.json();
    },
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
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
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            Belum ada modul training yang tersedia
          </CardContent>
        </Card>
      ) : (
        modules.map((module) => (
          <Card key={module.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <p className="mt-1 text-sm text-slate-600">{module.description}</p>
                </div>
                {getStatusIcon(module.progress?.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="h-4 w-4" />
                    <span>{module.duration_minutes} menit</span>
                  </div>
                  <span className="text-slate-500">
                    {getStatusLabel(module.progress?.status)}
                  </span>
                </div>
                {module.progress && module.progress.status === 'in_progress' && (
                  <div>
                    <Progress value={module.progress.progress_percent} className="h-2" />
                    <div className="mt-1 text-xs text-slate-500">
                      {Math.round(module.progress.progress_percent)}% selesai
                    </div>
                  </div>
                )}
                <Link
                  href={`/${locale}/guide/training/${module.id}`}
                  className="block"
                >
                  <button className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                    {module.progress?.status === 'completed' ? 'Lihat Ulang' : 'Mulai Training'}
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

