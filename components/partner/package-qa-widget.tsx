/**
 * Package Q&A Widget Component
 * AI-powered Q&A for package details
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageCircleQuestion,
  Send,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type QAItem = {
  id: string;
  question: string;
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  timestamp: Date;
};

type PackageQAWidgetProps = {
  packageId: string;
  packageName: string;
};

const SUGGESTED_QUESTIONS = [
  'Berapa batas usia anak-anak?',
  'Apa saja yang termasuk?',
  'Bisakah custom itinerary?',
  'Bagaimana child policy?',
];

export function PackageQAWidget({ packageId, packageName }: PackageQAWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [qaHistory, setQaHistory] = useState<QAItem[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [qaHistory]);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  const handleAsk = async (questionText?: string) => {
    const text = questionText || question.trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setQuestion('');

    try {
      const response = await fetch(`/api/partner/packages/${packageId}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit tercapai. Silakan tunggu sebentar.');
          return;
        }
        throw new Error('Failed to get answer');
      }

      const data = await response.json();

      const qaItem: QAItem = {
        id: `qa-${Date.now()}`,
        question: text,
        answer: data.answer.answer,
        confidence: data.answer.confidence,
        timestamp: new Date(),
      };

      setQaHistory((prev) => [...prev, qaItem]);
      setRemaining(data.remaining);
    } catch (error) {
      logger.error('Package Q&A error', error);
      toast.error('Gagal mendapatkan jawaban');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    const config = {
      high: { label: 'Akurat', className: 'bg-green-500' },
      medium: { label: 'Cukup Akurat', className: 'bg-yellow-500' },
      low: { label: 'Perlu Verifikasi', className: 'bg-red-500' },
    };
    return config[confidence];
  };

  return (
    <Card className="border-primary/20">
      <CardHeader
        className="cursor-pointer py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircleQuestion className="h-4 w-4 text-primary" />
            <span>Tanya AI tentang Paket Ini</span>
            <Badge variant="secondary" className="text-[10px]">AI</Badge>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Q&A History */}
          {qaHistory.length > 0 && (
            <ScrollArea className="h-48" ref={scrollRef}>
              <div className="space-y-4 pr-4">
                {qaHistory.map((qa) => {
                  const badge = getConfidenceBadge(qa.confidence);
                  return (
                    <div key={qa.id} className="space-y-2">
                      {/* Question */}
                      <div className="flex justify-end">
                        <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3 py-2 max-w-[85%]">
                          <p className="text-sm">{qa.question}</p>
                        </div>
                      </div>
                      {/* Answer */}
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2 max-w-[85%]">
                          <div className="flex items-center gap-2 mb-1">
                            <Bot className="h-3 w-3 text-primary" />
                            <Badge className={cn('text-[10px] text-white', badge.className)}>
                              {badge.label}
                            </Badge>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{qa.answer}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Welcome State */}
          {qaHistory.length === 0 && (
            <div className="text-center py-4">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Tanyakan apapun tentang <span className="font-medium">{packageName}</span>
              </p>
            </div>
          )}

          {/* Suggested Questions */}
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs h-auto py-1 px-2"
                onClick={() => handleAsk(q)}
                disabled={isLoading}
              >
                {q}
              </Button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pertanyaan..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={() => handleAsk()}
              disabled={!question.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Remaining */}
          {remaining !== null && (
            <p className="text-[10px] text-muted-foreground text-center">
              {remaining} pertanyaan tersisa hari ini
            </p>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sedang menjawab...
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

