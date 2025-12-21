'use client';

/**
 * Training Assessment Client Component
 * Self-rating slider + quiz questions for post-training assessment
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { logger } from '@/lib/utils/logger';

type AssessmentClientProps = {
  sessionId: string;
  locale: string;
};

type AssessmentQuestion = {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'rating';
  options: string[] | null;
  correct_answer: string | null;
  points: number;
  question_order: number;
};

export function AssessmentClient({ sessionId, locale }: AssessmentClientProps) {
  const [selfRating, setSelfRating] = useState([3]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Fetch questions
  const { data: questionsData, isLoading } = useQuery<{ questions: AssessmentQuestion[] }>({
    queryKey: ['training-assessment-questions', sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/guide/training/assessments/${sessionId}/questions`);
      if (!res.ok) throw new Error('Failed to fetch questions');
      return res.json();
    },
  });

  // Submit assessment
  const submitMutation = useMutation({
    mutationFn: async (payload: { self_rating: number; answers: Array<{ question_id: string; answer: string }> }) => {
      const res = await fetch(`/api/guide/training/assessments/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit assessment');
      }

      return res.json();
    },
    onSuccess: (data) => {
      setSubmitted(true);
      toast.success(
        data.message || 'Assessment submitted successfully',
        { duration: 5000 }
      );
    },
    onError: (error: Error) => {
      logger.error('Failed to submit assessment', error);
      toast.error(error.message || 'Failed to submit assessment');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const questions = questionsData?.questions || [];

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500">
          No assessment questions available for this session
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h3 className="mt-4 text-lg font-semibold text-green-900">Assessment Submitted</h3>
          <p className="mt-2 text-sm text-green-700">
            Thank you for completing the assessment. Your results have been recorded.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = () => {
    const answersArray = Object.entries(answers).map(([question_id, answer]) => ({
      question_id,
      answer,
    }));

    if (answersArray.length !== questions.length) {
      toast.error('Please answer all questions');
      return;
    }

    submitMutation.mutate({
      self_rating: selfRating[0] || 3,
      answers: answersArray,
    });
  };

  return (
    <div className="space-y-6">
      {/* Self-Rating Section */}
      <Card>
        <CardHeader>
          <CardTitle>Self-Rating</CardTitle>
          <CardDescription>
            Rate your understanding of this training (1 = Poor, 5 = Excellent)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Rating: {selfRating[0] || 3}/5</span>
              <span className="text-slate-500">
                {selfRating[0] === 1
                  ? 'Poor'
                  : selfRating[0] === 2
                    ? 'Fair'
                    : selfRating[0] === 3
                      ? 'Good'
                      : selfRating[0] === 4
                        ? 'Very Good'
                        : 'Excellent'}
              </span>
            </div>
            <Input
              type="number"
              min={1}
              max={5}
              value={selfRating[0] || 3}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (value >= 1 && value <= 5) {
                  setSelfRating([value]);
                }
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>1 - Poor</span>
              <span>5 - Excellent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Questions</CardTitle>
          <CardDescription>
            Answer all questions. Minimum passing score: 70%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-3">
              <Label className="text-base font-medium">
                {index + 1}. {question.question_text}
              </Label>
              {question.question_type === 'multiple_choice' && question.options ? (
                <RadioGroup
                  value={answers[question.id] || ''}
                  onValueChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
                >
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                      <Label htmlFor={`${question.id}-${optIndex}`} className="font-normal cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="text-sm text-slate-500">Rating question (handled separately)</div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={submitMutation.isPending || Object.keys(answers).length !== questions.length}
        className="w-full"
        size="lg"
      >
        {submitMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Assessment'
        )}
      </Button>
    </div>
  );
}

