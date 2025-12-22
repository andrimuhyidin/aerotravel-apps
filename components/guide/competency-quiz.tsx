/**
 * Competency Quiz Component
 * Interactive quiz interface for training competency assessment
 */

'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import queryKeys from '@/lib/queries/query-keys';

type CompetencyQuizProps = {
  quizId: string;
  onComplete?: (passed: boolean, score: number) => void;
};

type Question = {
  id: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: Array<{ text: string; is_correct?: boolean }>;
  points: number;
};

export function CompetencyQuiz({ quizId, onComplete }: CompetencyQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Fetch quiz data
  const { data, isLoading, error } = useQuery<{
    quiz: {
      id: string;
      quizTitle: string;
      quizDescription?: string;
      passingScore: number;
      timeLimitMinutes?: number;
      canAttempt: boolean;
      attemptCount: number;
      bestScore: number;
      remainingAttempts: number;
    };
    questions: Question[];
    previousAttempts: Array<{
      id: string;
      score: number;
      passed: boolean;
      completedAt: string;
    }>;
  }>({
    queryKey: queryKeys.guide.training.quiz(quizId),
    queryFn: async () => {
      const res = await fetch(`/api/guide/training/quiz/${quizId}`);
      if (!res.ok) throw new Error('Failed to fetch quiz');
      return res.json();
    },
  });

  // Timer effect
  useEffect(() => {
    if (!data?.quiz.timeLimitMinutes || timeRemaining === null) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [data?.quiz.timeLimitMinutes, timeRemaining]);

  // Initialize timer when quiz starts
  useEffect(() => {
    if (data?.quiz.timeLimitMinutes && startTime === null) {
      setStartTime(Date.now());
      setTimeRemaining(data.quiz.timeLimitMinutes * 60);
    }
  }, [data?.quiz.timeLimitMinutes, startTime]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : undefined;
      
      const res = await fetch(`/api/guide/training/quiz/${quizId}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          timeTakenSeconds: timeTaken,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit quiz');
      }

      return res.json();
    },
    onSuccess: (result) => {
      toast.success(
        result.attempt.passed
          ? `Selamat! Anda lulus dengan score ${result.attempt.score}%`
          : `Score: ${result.attempt.score}%. Anda belum lulus (minimum: ${data?.quiz.passingScore}%)`
      );
      onComplete?.(result.attempt.passed, result.attempt.score);
    },
    onError: (error: Error) => {
      logger.error('Quiz submission error', error);
      toast.error(error.message || 'Gagal mengirim jawaban');
    },
  });

  const handleAnswerChange = (questionId: string, answer: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < (data?.questions.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Validate all questions answered
    const unanswered = data?.questions.filter((q) => !answers[q.id]);
    if (unanswered && unanswered.length > 0) {
      toast.error(`Masih ada ${unanswered.length} pertanyaan yang belum dijawab`);
      return;
    }

    submitMutation.mutate();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <ErrorState message="Gagal memuat quiz" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.quiz.canAttempt) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={XCircle}
            title="Tidak dapat mengikuti quiz"
            description={`Anda sudah mencapai batas maksimal attempt (${data?.quiz.attemptCount || 0}). Score terbaik: ${data?.quiz.bestScore}%`}
          />
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = data.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / data.questions.length) * 100;
  const allAnswered = data.questions.every((q) => answers[q.id] !== undefined);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{data.quiz.quizTitle}</CardTitle>
            {data.quiz.quizDescription && (
              <p className="text-sm text-slate-600 mt-1">{data.quiz.quizDescription}</p>
            )}
          </div>
          {timeRemaining !== null && (
            <div className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-lg',
              timeRemaining < 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            )}>
              <Clock className="h-4 w-4" />
              <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>
              Pertanyaan {currentQuestionIndex + 1} dari {data.questions.length}
            </span>
            <span>
              Passing Score: {data.quiz.passingScore}% | Attempts: {data.quiz.attemptCount}/{data.quiz.remainingAttempts + data.quiz.attemptCount}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentQuestion ? (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">
                {currentQuestion.questionText}
              </Label>
              <p className="text-xs text-slate-500 mt-1">
                {currentQuestion.points} poin
              </p>
            </div>

            {currentQuestion.questionType === 'multiple_choice' && (
              <RadioGroup
                value={String(answers[currentQuestion.id] || '')}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                {currentQuestion.options?.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                    <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.questionType === 'true_false' && (
              <RadioGroup
                value={String(answers[currentQuestion.id] || '')}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true" className="flex-1 cursor-pointer">Benar</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false" className="flex-1 cursor-pointer">Salah</Label>
                </div>
              </RadioGroup>
            )}

            {currentQuestion.questionType === 'short_answer' && (
              <Textarea
                value={String(answers[currentQuestion.id] || '')}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Tulis jawaban Anda di sini..."
                rows={4}
              />
            )}
          </div>
        ) : null}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Sebelumnya
          </Button>

          <div className="flex gap-2">
            {currentQuestionIndex < data.questions.length - 1 ? (
              <Button onClick={handleNext} disabled={!currentQuestion || !answers[currentQuestion.id]}>
                Selanjutnya
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered || submitMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitMutation.isPending ? 'Mengirim...' : 'Kirim Jawaban'}
              </Button>
            )}
          </div>
        </div>

        {/* Previous Attempts */}
        {data.previousAttempts.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">Attempt Sebelumnya</h4>
            <div className="space-y-2">
              {data.previousAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg text-sm',
                    attempt.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {attempt.passed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span>Score: {attempt.score}%</span>
                  </div>
                  <span className="text-xs">
                    {new Date(attempt.completedAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

