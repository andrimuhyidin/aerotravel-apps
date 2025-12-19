'use client';

/**
 * Assessment Results Client Component
 * Display assessment results with AI insights
 */

import { useQuery } from '@tanstack/react-query';
import { Brain, CheckCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type AssessmentResultsClientProps = {
  locale: string;
  assessmentId: string;
};

type AssessmentResult = {
  assessment: {
    id: string;
    score: number | null;
    category: string | null;
    insights: {
      summary?: string;
      strengths?: string[];
      improvements?: string[];
      recommendations?: string[];
    } | null;
    completed_at: string;
    template?: {
      name: string;
      description: string;
    };
  };
};

export function AssessmentResultsClient({ locale, assessmentId }: AssessmentResultsClientProps) {
  const { data, isLoading, error } = useQuery<AssessmentResult>({
    queryKey: queryKeys.guide.assessments.assessment(assessmentId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/assessments/${assessmentId}`);
      if (!res.ok) throw new Error('Failed to load results');
      return (await res.json()) as AssessmentResult;
    },
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <LoadingState variant="skeleton" lines={4} />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent>
          <ErrorState
            message={error instanceof Error ? error.message : 'Gagal memuat hasil assessment'}
            onRetry={() => window.location.reload()}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  const assessment = data.assessment;
  const score = assessment.score;
  const insights = assessment.insights;

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-500';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return 'bg-slate-100';
    if (score >= 80) return 'bg-emerald-100';
    if (score >= 60) return 'bg-amber-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Score Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <div className={cn('mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full', getScoreBg(score))}>
            {score !== null ? (
              <span className={cn('text-4xl font-bold', getScoreColor(score))}>
                {score}
              </span>
            ) : (
              <CheckCircle className="h-12 w-12 text-slate-500" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {assessment.template?.name || 'Assessment Selesai'}
          </h1>
          {score !== null && (
            <p className="text-slate-600 mb-4">
              Score: {score}%
            </p>
          )}
          {assessment.category && (
            <Badge variant="outline" className="text-sm">
              {assessment.category}
            </Badge>
          )}
          <p className="text-sm text-slate-500 mt-4">
            Selesai pada {new Date(assessment.completed_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {insights && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-emerald-600" />
              Insight AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.summary && (
              <div className="rounded-xl bg-white p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Ringkasan</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{insights.summary}</p>
              </div>
            )}

            {insights.strengths && insights.strengths.length > 0 && (
              <div className="rounded-xl bg-white p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Kekuatan
                </h3>
                <ul className="space-y-2">
                  {insights.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.improvements && insights.improvements.length > 0 && (
              <div className="rounded-xl bg-white p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                  Area Peningkatan
                </h3>
                <ul className="space-y-2">
                  {insights.improvements.map((improvement, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.recommendations && insights.recommendations.length > 0 && (
              <div className="rounded-xl bg-white p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  Rekomendasi
                </h3>
                <ul className="space-y-2">
                  {insights.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/${locale}/guide/assessments`} className="flex-1">
          <Button variant="outline" className="w-full">Kembali ke Assessments</Button>
        </Link>
        <Link href={`/${locale}/guide`} className="flex-1">
          <Button className="w-full">Ke Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
