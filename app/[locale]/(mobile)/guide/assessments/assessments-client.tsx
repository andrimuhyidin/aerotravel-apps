'use client';

/**
 * Assessments Client Component
 * List available assessments and assessment history
 */

import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type AssessmentsClientProps = {
  locale: string;
};

type AssessmentTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  assessment_type: string;
  estimated_minutes: number | null;
  passing_score: number | null;
};

type Assessment = {
  id: string;
  template_id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  category: string | null;
  status: string;
  template?: AssessmentTemplate;
};

export function AssessmentsClient({ locale }: AssessmentsClientProps) {
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');

  // Fetch available assessments
  const { data: availableData, isLoading: availableLoading } = useQuery<{
    templates: AssessmentTemplate[];
  }>({
    queryKey: queryKeys.guide.assessments.available(),
    queryFn: async () => {
      const res = await fetch('/api/guide/assessments/available');
      if (!res.ok) throw new Error('Failed to load assessments');
      return (await res.json()) as { templates: AssessmentTemplate[] };
    },
  });

  // Fetch assessment history
  const { data: historyData, isLoading: historyLoading } = useQuery<{
    assessments: Assessment[];
    total: number;
  }>({
    queryKey: queryKeys.guide.assessments.history(),
    queryFn: async () => {
      const res = await fetch('/api/guide/assessments/history?limit=20');
      if (!res.ok) throw new Error('Failed to load history');
      return (await res.json()) as { assessments: Assessment[]; total: number };
    },
  });

  const availableTemplates = availableData?.templates || [];
  const historyAssessments = historyData?.assessments || [];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'self_assessment':
        return 'Self Assessment';
      case 'performance_review':
        return 'Performance Review';
      case 'skills_evaluation':
        return 'Skills Evaluation';
      default:
        return category;
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-500';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4 pb-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">
            Tersedia ({availableTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Riwayat ({historyAssessments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4 mt-4">
          {availableLoading ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <LoadingState variant="skeleton" lines={3} />
              </CardContent>
            </Card>
          ) : availableTemplates.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12">
                <EmptyState
                  icon={FileText}
                  title="Tidak ada assessment tersedia"
                  description="Semua assessment yang tersedia akan muncul di sini"
                  variant="default"
                />
              </CardContent>
            </Card>
          ) : (
            availableTemplates.map((template) => (
              <Card key={template.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                      {template.description && (
                        <p className="text-sm text-slate-600">{template.description}</p>
                      )}
                    </div>
                    <Badge variant="outline">{getCategoryLabel(template.category)}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                    {template.estimated_minutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{template.estimated_minutes} menit</span>
                      </div>
                    )}
                    {template.passing_score && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>Pass: {template.passing_score}%</span>
                      </div>
                    )}
                  </div>
                  <Link href={`/${locale}/guide/assessments/start/${template.id}`}>
                    <Button className="w-full">Mulai Assessment</Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          {historyLoading ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <LoadingState variant="skeleton" lines={3} />
              </CardContent>
            </Card>
          ) : historyAssessments.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12">
                <EmptyState
                  icon={FileText}
                  title="Belum ada assessment"
                  description="Mulai assessment pertama Anda untuk melihat riwayat di sini"
                  variant="default"
                />
              </CardContent>
            </Card>
          ) : (
            historyAssessments.map((assessment) => (
              <Card key={assessment.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">
                          {assessment.template?.name || 'Assessment'}
                        </h3>
                        {assessment.status === 'completed' && (
                          <Badge variant="outline" className="text-xs">Selesai</Badge>
                        )}
                      </div>
                      {assessment.template?.description && (
                        <p className="text-sm text-slate-600 mb-2">
                          {assessment.template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>
                          {new Date(assessment.started_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {assessment.score !== null && (
                          <span className={cn('font-semibold', getScoreColor(assessment.score))}>
                            Score: {assessment.score}%
                          </span>
                        )}
                        {assessment.category && (
                          <Badge variant="secondary" className="text-xs">
                            {assessment.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Link href={`/${locale}/guide/assessments/${assessment.id}`}>
                      <Button variant="ghost" size="sm">
                        Lihat
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
