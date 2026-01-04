'use client';

/**
 * Assessment Start Client Component
 * Multi-step assessment interface with auto-save
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type AssessmentStartClientProps = {
  locale: string;
  templateId: string;
};

type Question = {
  id: string;
  type: 'multiple_choice' | 'rating' | 'text' | 'yes_no' | 'scale';
  question: string;
  options?: string[];
  scale?: number;
  required?: boolean;
  weight?: number;
  category?: string;
};

type AssessmentTemplate = {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  assessment_type: string;
  estimated_minutes: number | null;
};

type Assessment = {
  id: string;
  template_id: string;
  answers: Record<string, unknown>;
  status: string;
  started_at: string;
};

export function AssessmentStartClient({ locale, templateId }: AssessmentStartClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start or get existing assessment
  const { data: assessmentData, isLoading: assessmentLoading } = useQuery<{
    assessmentId: string;
    assessment: Assessment;
    template: AssessmentTemplate;
  }>({
    queryKey: ['assessment', templateId],
    queryFn: async () => {
      // Try to start new assessment
      const startRes = await fetch('/api/guide/assessments/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });
      if (!startRes.ok) throw new Error('Failed to start assessment');
      const startData = await startRes.json();
      return {
        assessmentId: startData.assessmentId,
        assessment: startData.assessment,
        template: startData.template,
      };
    },
  });

  // Auto-save answers
  const saveMutation = useMutation({
    mutationFn: async (answersToSave: Record<string, unknown>) => {
      if (!assessmentData?.assessmentId) return;
      await fetch(`/api/guide/assessments/${assessmentData.assessmentId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersToSave }),
      });
    },
  });

  useEffect(() => {
    if (assessmentData?.assessment?.answers) {
      setAnswers(assessmentData.assessment.answers);
    }
  }, [assessmentData]);

  // Auto-save on answer change
  useEffect(() => {
    if (Object.keys(answers).length > 0 && assessmentData?.assessmentId) {
      const timeoutId = setTimeout(() => {
        saveMutation.mutate(answers);
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [answers, assessmentData?.assessmentId]);

  // Submit assessment
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!assessmentData?.assessmentId) throw new Error('Assessment not started');
      const res = await fetch(`/api/guide/assessments/${assessmentData.assessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error('Failed to submit assessment');
      return (await res.json()) as { success: boolean; score?: number; category?: string };
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.assessments.history() });
      router.push(`/${locale}/guide/assessments/${assessmentData?.assessmentId}/results`);
    },
  });

  const template = assessmentData?.template;
  const questions = template?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const handleAnswer = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    submitMutation.mutate();
  };

  const isCurrentQuestionAnswered = currentQuestion && answers[currentQuestion.id] !== undefined;

  if (assessmentLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <LoadingState variant="skeleton" lines={4} />
        </CardContent>
      </Card>
    );
  }

  if (!template || !assessmentData) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent>
          <ErrorState
            message="Assessment tidak ditemukan"
            onRetry={() => window.location.reload()}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-slate-900">{template.name}</h1>
            <Link href={`/${locale}/guide/assessments`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Batal
              </Button>
            </Link>
          </div>
          {template.description && (
            <p className="text-sm text-slate-600">{template.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-600">
              Pertanyaan {currentQuestionIndex + 1} dari {totalQuestions}
            </span>
            {template.estimated_minutes && (
              <div className="flex items-center gap-1 text-slate-500">
                <Clock className="h-4 w-4" />
                <span>{template.estimated_minutes} menit</span>
              </div>
            )}
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      {currentQuestion && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {currentQuestion.question}
              </h2>
              {currentQuestion.required && (
                <Badge variant="outline" className="text-xs">Wajib diisi</Badge>
              )}
            </div>

            {/* Answer Input */}
            <div className="space-y-4">
              {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                <RadioGroup
                  value={String(answers[currentQuestion.id] || '')}
                  onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={String(index)} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="cursor-pointer flex-1">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === 'rating' && (
                <div className="flex items-center gap-2">
                  {Array.from({ length: currentQuestion.scale || 5 }, (_, i) => i + 1).map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleAnswer(currentQuestion.id, rating)}
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-lg border-2 font-semibold transition-all',
                        answers[currentQuestion.id] === rating
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                      )}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'text' && (
                <textarea
                  value={String(answers[currentQuestion.id] || '')}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="w-full min-h-[120px] rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Tulis jawaban Anda di sini..."
                />
              )}

              {currentQuestion.type === 'yes_no' && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleAnswer(currentQuestion.id, true)}
                    className={cn(
                      'flex-1 rounded-lg border-2 p-4 font-medium transition-all',
                      answers[currentQuestion.id] === true
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                    )}
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnswer(currentQuestion.id, false)}
                    className={cn(
                      'flex-1 rounded-lg border-2 p-4 font-medium transition-all',
                      answers[currentQuestion.id] === false
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                    )}
                  >
                    Tidak
                  </button>
                </div>
              )}

              {currentQuestion.type === 'scale' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Sangat Rendah</span>
                    <span>Sangat Tinggi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: currentQuestion.scale || 10 }, (_, i) => i + 1).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleAnswer(currentQuestion.id, value)}
                        className={cn(
                          'flex h-10 flex-1 items-center justify-center rounded-lg border-2 text-sm font-medium transition-all',
                          answers[currentQuestion.id] === value
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Sebelumnya
        </Button>

        {currentQuestionIndex < totalQuestions - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!isCurrentQuestionAnswered && currentQuestion?.required}
          >
            Selanjutnya
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!isCurrentQuestionAnswered && currentQuestion?.required || isSubmitting || submitMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting || submitMutation.isPending ? (
              'Mengirim...'
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Selesai & Kirim
              </>
            )}
          </Button>
        )}
      </div>

      {/* Auto-save indicator */}
      {saveMutation.isPending && (
        <div className="text-center text-xs text-slate-500">
          Menyimpan...
        </div>
      )}
    </div>
  );
}
