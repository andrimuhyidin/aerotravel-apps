/**
 * Product Q&A Widget
 * Chat interface untuk product questions di package detail page
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

type QAMessage = {
  id: string;
  type: 'question' | 'answer';
  content: string;
  timestamp: Date;
  confidence?: 'high' | 'medium' | 'low';
  suggestedQuestions?: string[];
};

type ProductQAWidgetProps = {
  packageId: string;
  packageName: string;
};

const COMMON_QUESTIONS = [
  'Berapa batas usia untuk anak-anak?',
  'Apa saja yang termasuk dalam paket?',
  'Berapa harga paket ini?',
  'Bisakah itinerary diubah?',
  'Apakah ada diskon untuk grup?',
];

export function ProductQAWidget({ packageId, packageName }: ProductQAWidgetProps) {
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const questionText = question.trim();
    setQuestion('');

    // Add question to messages
    const questionMessage: QAMessage = {
      id: `q-${Date.now()}`,
      type: 'question',
      content: questionText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, questionMessage]);

    // Get answer
    setLoading(true);
    try {
      const response = await fetch(`/api/partner/packages/${packageId}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await response.json();
      const answer = data.answer as {
        answer: string;
        confidence: 'high' | 'medium' | 'low';
        suggestedQuestions?: string[];
      };

      // Add answer to messages
      const answerMessage: QAMessage = {
        id: `a-${Date.now()}`,
        type: 'answer',
        content: answer.answer,
        timestamp: new Date(),
        confidence: answer.confidence,
        suggestedQuestions: answer.suggestedQuestions,
      };
      setMessages((prev) => [...prev, answerMessage]);
    } catch (error) {
      logger.error('Failed to get Q&A answer', error);
      toast.error('Gagal mendapatkan jawaban. Silakan coba lagi.');
      
      // Add error message
      const errorMessage: QAMessage = {
        id: `e-${Date.now()}`,
        type: 'answer',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi customer service.',
        timestamp: new Date(),
        confidence: 'low',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (suggestedQ: string) => {
    setQuestion(suggestedQ);
    // Auto-submit
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Tanya tentang {packageName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Common Questions */}
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Pertanyaan umum:
            </p>
            <div className="flex flex-wrap gap-2">
              {COMMON_QUESTIONS.map((q, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestedQuestion(q)}
                  className="text-xs"
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="h-[400px] w-full pr-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tanyakan apapun tentang paket ini</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === 'question' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'question'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.type === 'answer' && message.confidence && (
                    <div className="mt-2 text-xs opacity-70">
                      {message.confidence === 'high' && '✓ High confidence'}
                      {message.confidence === 'medium' && '⚠ Medium confidence'}
                      {message.confidence === 'low' && '? Low confidence'}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggested Questions */}
        {messages.length > 0 && 
          messages[messages.length - 1]?.type === 'answer' &&
          messages[messages.length - 1]?.suggestedQuestions &&
          messages[messages.length - 1].suggestedQuestions!.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Pertanyaan terkait:
              </p>
              <div className="flex flex-wrap gap-2">
                {messages[messages.length - 1].suggestedQuestions!.map((q, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSuggestedQuestion(q)}
                    className="text-xs h-auto py-1 px-2"
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Tanyakan tentang paket ini..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !question.trim()}>
            {loading ? (
              <Skeleton className="h-4 w-4 rounded-full" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

