'use client';

import { Lightbulb, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';

type AiInsights = {
  income_prediction?: {
    next_month?: number;
    next_3_months?: number;
    confidence?: 'high' | 'medium' | 'low';
    reasoning?: string;
  };
  recommendations?: Array<{
    type?: string;
    title?: string;
    description?: string;
    priority?: 'high' | 'medium' | 'low';
  }>;
  performance_insights?: {
    strengths?: string[];
    improvements?: string[];
    trend?: 'improving' | 'stable' | 'declining';
  };
};

type AiContext = {
  guideName?: string;
  completedTrips?: number;
  totalEarnings?: number;
  averageRating?: number;
  currentBalance?: number;
  recentTripsCount?: number;
};

type GuideAiAssistantProps = {
  locale: string;
};

export function GuideAiAssistant({ locale: _locale }: GuideAiAssistantProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [context, setContext] = useState<AiContext | null>(null);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/guide/insights/ai');
      if (!res.ok) {
        throw new Error('Gagal memuat insight AI');
      }
      const json = (await res.json()) as { insights: AiInsights; context: AiContext };
      setInsights(json.insights);
      setContext(json.context);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat insight AI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      await loadInsights();
      if (!mounted) return;
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Lightbulb className="h-5 w-5 text-emerald-600" />
            Asisten AI Trip
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState variant="spinner" message="Memuat insight pribadi..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Lightbulb className="h-5 w-5 text-emerald-600" />
            Asisten AI Trip
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState
            message={error}
            onRetry={loadInsights}
            variant="card"
            showIcon={false}
          />
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Lightbulb className="h-5 w-5 text-emerald-600" />
            Asisten AI Trip
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Lightbulb}
            title="Belum ada insight tersedia"
            description="Insight AI akan muncul setelah Anda menyelesaikan beberapa trip"
            variant="subtle"
          />
        </CardContent>
      </Card>
    );
  }

  const topRecommendation = insights.recommendations?.[0];
  const strengths = insights.performance_insights?.strengths || [];
  const improvements = insights.performance_insights?.improvements || [];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base font-semibold text-slate-900">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-emerald-600" />
            <span>Asisten AI Trip</span>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            Beta
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {context && (
          <p className="text-slate-600">
            Hai{' '}
            <span className="font-semibold text-slate-900">
              {context.guideName || 'Guide'}
            </span>
            , berikut ringkasan singkat performa kamu dan saran untuk trip-trip berikutnya.
          </p>
        )}

        {topRecommendation && (
          <div className="rounded-lg bg-emerald-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              Saran Utama
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-900">
              {topRecommendation.title}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-emerald-800">
              {topRecommendation.description}
            </p>
          </div>
        )}

        {(strengths.length > 0 || improvements.length > 0) && (
          <div className="grid grid-cols-2 gap-2">
            {strengths.length > 0 && (
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-[11px] font-semibold text-slate-800">Kekuatan</p>
                <ul className="mt-1 space-y-1 text-[11px] text-slate-600">
                  {strengths.slice(0, 3).map((item) => (
                    <li key={item} className="flex gap-1.5">
                      <span className="mt-[3px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                      <span className="line-clamp-2">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {improvements.length > 0 && (
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-[11px] font-semibold text-slate-800">Perlu Dijaga</p>
                <ul className="mt-1 space-y-1 text-[11px] text-slate-600">
                  {improvements.slice(0, 3).map((item) => (
                    <li key={item} className="flex gap-1.5">
                      <span className="mt-[3px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                      <span className="line-clamp-2">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {insights.income_prediction && (
          <div className="rounded-lg bg-slate-50 p-2.5">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[11px] font-semibold text-slate-800">Perkiraan Pendapatan</p>
            </div>
            <p className="mt-1 text-[11px] text-slate-600">
              Bulan depan (perkiraan kasar):{' '}
              <span className="font-semibold text-slate-900">
                {typeof insights.income_prediction.next_month === 'number'
                  ? `Rp ${insights.income_prediction.next_month.toLocaleString('id-ID')}`
                  : '-'}
              </span>
              .
            </p>
            {insights.income_prediction.reasoning && (
              <p className="mt-0.5 text-[11px] text-slate-500">
                {insights.income_prediction.reasoning}
              </p>
            )}
          </div>
        )}

        <p className="pt-1 text-[10px] text-slate-400">
          Insight ini bersifat bantuan, bukan keputusan final. Selalu ikuti SOP resmi dan
          arahan Ops.
        </p>
      </CardContent>
    </Card>
  );
}

