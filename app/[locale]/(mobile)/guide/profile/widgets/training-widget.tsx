/**
 * Training Widget Component
 * Compact training modules display for profile
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, ChevronRight, Play } from 'lucide-react';
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

type TrainingWidgetProps = {
  locale: string;
};

export function TrainingWidget({ locale }: TrainingWidgetProps) {
  const { data, isLoading } = useQuery<TrainingResponse>({
    queryKey: [...queryKeys.guide.all, 'training', 'modules'],
    queryFn: async () => {
      const res = await fetch('/api/guide/training/modules');
      if (!res.ok) throw new Error('Failed to fetch training modules');
      const responseData = await res.json();
      // Handle both { data: { modules } } and { modules } formats
      return (responseData.data ?? responseData) as TrainingResponse;
    },
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const modules = data?.modules || [];
  const inProgressModules = modules.filter(
    (m) => m?.progress?.status === 'in_progress'
  ).slice(0, 2);
  const notStartedModules = modules.filter(
    (m) => !m?.progress || m.progress.status === 'not_started'
  ).slice(0, 1);

  const displayModules = [...inProgressModules, ...notStartedModules].slice(0, 2);

  if (displayModules.length === 0) {
    return null;
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-500" />;
      default:
        return <BookOpen className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Training Modules</CardTitle>
          <Link
            href={`/${locale}/guide/training`}
            className="text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700"
          >
            Lihat Semua
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayModules.map((module) => {
          if (!module?.id || !module?.title) return null;
          return (
            <Link
              key={module.id}
              href={`/${locale}/guide/training/${module.id}`}
              className="block rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-slate-100"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(module.progress?.status)}
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {module.title}
                    </h3>
                  </div>
                  {module.progress && module.progress.status === 'in_progress' && (
                    <div className="mt-2">
                      <Progress value={module.progress.progress_percent ?? 0} className="h-1.5" />
                      <div className="mt-1 text-xs text-slate-500">
                        {Math.round(module.progress.progress_percent ?? 0)}% selesai
                      </div>
                    </div>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

