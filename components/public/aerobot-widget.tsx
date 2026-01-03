/**
 * AeroBot Widget Component
 * Floating AI chatbot for public users
 * Supports both floating and embedded modes
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  Loader2,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const SUGGESTED_QUESTIONS = [
  'Paket apa yang cocok untuk keluarga?',
  'Berapa harga trip ke Pahawang?',
  'Apa saja yang termasuk dalam paket?',
  'Kapan waktu terbaik ke Lampung?',
];

type AerobotWidgetProps = {
  embedded?: boolean;
};

export function AerobotWidget({ embedded = false }: AerobotWidgetProps) {
  const [isOpen, setIsOpen] = useState(embedded); // Auto-open in embedded mode
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/public/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Terlalu banyak request. Silakan tunggu sebentar.');
          return;
        }
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setRemaining(data.remaining);
    } catch (error) {
      logger.error('AeroBot error', error);
      toast.error('Gagal mendapatkan respons');

      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
  };

  // Render chat window content (shared between floating and embedded modes)
  const renderChatWindow = () => {
    // Native chat mode for embedded
    if (embedded) {
      return (
        <div className="flex h-[calc(100vh-280px)] flex-col bg-slate-50 dark:bg-slate-900">
          {/* Native Chat Header */}
          <div className="flex items-center gap-3 border-b bg-white px-4 py-3 dark:bg-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-aero-teal to-primary">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">AeroBot</h3>
              <p className="text-xs text-muted-foreground">
                {remaining !== null ? `${remaining} chat tersisa` : 'Online'}
              </p>
            </div>
          </div>

          {/* Messages Area - Native Chat Style */}
          <div className="flex-1 overflow-y-auto px-4 py-4" ref={scrollRef}>
            <div className="space-y-3">
              {/* Welcome Message */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-aero-teal to-primary">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-base font-semibold">Halo! Saya AeroBot 👋</p>
                  <p className="mt-1 text-center text-sm text-muted-foreground">
                    Asisten wisata Aero Travel. Ada yang bisa saya bantu?
                  </p>

                  {/* Suggested Questions */}
                  <div className="mt-6 w-full space-y-2">
                    <p className="text-center text-xs font-medium text-muted-foreground">
                      Coba tanyakan:
                    </p>
                    <div className="flex flex-col gap-2">
                      {SUGGESTED_QUESTIONS.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestedQuestion(q)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages - Native Chat Bubbles */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-end gap-2',
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar for assistant messages */}
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aero-teal to-primary">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
                      message.role === 'user'
                        ? 'rounded-tr-sm bg-primary text-primary-foreground'
                        : 'rounded-tl-sm bg-white text-foreground dark:bg-slate-800'
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </p>
                    <p
                      className={cn(
                        'mt-1.5 text-[10px]',
                        message.role === 'user'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}
                    >
                      {message.timestamp.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Spacer for user messages */}
                  {message.role === 'user' && <div className="h-8 w-8 shrink-0" />}
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-end gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aero-teal to-primary">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 shadow-sm dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Mengetik...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area - Native Style */}
          <div className="border-t bg-white p-3 dark:bg-slate-800">
            <div className="flex items-end gap-2">
              <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ketik pesan..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  disabled={isLoading}
                  maxLength={500}
                />
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-50"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Widget mode (floating)
    return (
      <Card className="overflow-hidden border-0 shadow-2xl">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-aero-teal to-primary p-4 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Bot className="h-5 w-5" />
              AeroBot
            </CardTitle>
            <div className="flex items-center gap-2">
              {remaining !== null && (
                <Badge variant="secondary" className="bg-white/20 text-xs">
                  {remaining} tersisa
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="p-0">
          <ScrollArea className="h-80" ref={scrollRef}>
            <div className="space-y-4 p-4">
              {/* Welcome Message */}
              {messages.length === 0 && (
                <div className="py-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Halo! Saya AeroBot 👋</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Asisten wisata Aero Travel. Ada yang bisa saya bantu?
                  </p>

                  {/* Suggested Questions */}
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-muted-foreground">Coba tanyakan:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {SUGGESTED_QUESTIONS.map((q, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="h-auto px-2 py-1 text-xs"
                          onClick={() => handleSuggestedQuestion(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2',
                      message.role === 'user'
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md bg-muted'
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    <p
                      className={cn(
                        'mt-1 text-[10px]',
                        message.role === 'user'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}
                    >
                      {message.timestamp.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Sedang mengetik...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t bg-background p-3">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pertanyaan..."
                className="flex-1"
                disabled={isLoading}
                maxLength={500}
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Embedded mode: render directly without floating button
  if (embedded) {
    return renderChatWindow();
  }

  // Floating mode: render with floating button and overlay
  return (
    <>
      {/* Floating Button - Positioned within mobile wrapper (max-w-md) */}
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-24 left-0 right-0 z-40 pointer-events-none">
            <div className="mx-auto w-full max-w-md px-4 pointer-events-auto">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex justify-end sm:justify-end"
              >
                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full bg-gradient-to-r from-[hsl(var(--aero-teal))] to-primary shadow-lg hover:shadow-xl transition-shadow"
                  onClick={() => setIsOpen(true)}
                  aria-label="Open AeroBot chat"
                >
                  <Sparkles className="h-6 w-6 text-white flex-shrink-0" aria-hidden="true" />
                  <span className="sr-only">Chat dengan AeroBot</span>
                </Button>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Window - Positioned within mobile wrapper */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-24 left-0 right-0 z-50 pointer-events-none">
            <div className="mx-auto w-full max-w-md px-4 pointer-events-auto">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full sm:w-96 sm:ml-auto"
              >
                {renderChatWindow()}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

