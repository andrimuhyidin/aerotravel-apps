/**
 * Chat Page Client Component
 * Full-page chat interface with AI Assistant, Ops Chat, and Broadcasts
 */

'use client';

import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  ArrowLeft,
  Bot,
  Loader2,
  Megaphone,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'ops';
  content: string;
  timestamp: Date;
  sender?: string;
};

type ChatPageClientProps = {
  locale: string;
  userId: string;
  userName: string;
};

const suggestedQuestions = [
  'Status trip hari ini?',
  'Berapa total booking minggu ini?',
  'SOP keselamatan perjalanan?',
  'Revenue bulan ini berapa?',
  'Cara menghubungi customer service?',
  'Prosedur emergency?',
];

export function ChatPageClient({ locale, userId, userName }: ChatPageClientProps) {
  const [activeTab, setActiveTab] = useState('ai');
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiMessages]);

  // AI Chat handler
  const handleAiSend = async (messageText?: string) => {
    const text = messageText || aiInput.trim();
    if (!text || isAiLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
      sender: userName,
    };

    setAiMessages((prev) => [...prev, userMessage]);
    setAiInput('');
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'Maaf, saya tidak dapat memproses permintaan Anda.',
        timestamp: new Date(),
      };

      setAiMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      logger.error('AI chat error', error);
      toast.error('Gagal mendapatkan respons AI');
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        timestamp: new Date(),
      };
      setAiMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAiSend();
    }
  };

  return (
    <div className="h-full flex flex-col py-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/console`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            AI Assistant, Team Chat, and Broadcasts
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="shrink-0 mb-4">
          <TabsTrigger value="ai" className="gap-2">
            <Bot className="h-4 w-4" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="ops" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Ops Chat
            <Badge variant="secondary" className="ml-1">
              Soon
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="broadcasts" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Broadcasts
            <Badge variant="secondary" className="ml-1">
              Soon
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* AI Assistant Tab */}
        <TabsContent value="ai" className="flex-1 flex flex-col overflow-hidden m-0">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                {aiMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <div className="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-4 mb-4">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-xl mb-2">AI Assistant</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Tanyakan apa saja tentang operasional bisnis, SOP, data
                      booking, revenue, atau informasi lainnya.
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-w-lg">
                      {suggestedQuestions.map((q) => (
                        <Button
                          key={q}
                          variant="outline"
                          size="sm"
                          className="text-left h-auto py-2 px-3 justify-start"
                          onClick={() => handleAiSend(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {aiMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-3',
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.role === 'assistant' && (
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                              <Bot className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            'max-w-[80%] rounded-2xl px-4 py-3',
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-2">
                            {format(message.timestamp, 'HH:mm', { locale: idLocale })}
                          </p>
                        </div>
                        {message.role === 'user' && (
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="bg-secondary text-sm">
                              {userName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    {isAiLoading && (
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                            <Bot className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-2xl px-4 py-3">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t shrink-0">
                <div className="flex gap-2 max-w-3xl mx-auto">
                  <Input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ketik pertanyaan..."
                    disabled={isAiLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleAiSend()}
                    disabled={!aiInput.trim() || isAiLoading}
                    size="icon"
                  >
                    {isAiLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ops Chat Tab */}
        <TabsContent value="ops" className="flex-1 m-0">
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center h-full text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Ops Chat</h3>
              <p className="text-muted-foreground max-w-md">
                Chat langsung dengan guide yang sedang bertugas. Monitor status
                trip dan komunikasi real-time.
              </p>
              <Badge variant="secondary" className="mt-4">
                Coming Soon
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Broadcasts Tab */}
        <TabsContent value="broadcasts" className="flex-1 m-0">
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center h-full text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Megaphone className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Broadcasts</h3>
              <p className="text-muted-foreground max-w-md">
                Kirim pengumuman ke semua guide, partner, atau grup tertentu.
                Notifikasi akan dikirim via push notification dan WhatsApp.
              </p>
              <Badge variant="secondary" className="mt-4">
                Coming Soon
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

