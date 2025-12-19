'use client';

/**
 * Trip AI Chat Component
 * Context-aware AI chat assistant untuk trip
 */

import { useMutation } from '@tanstack/react-query';
import { Bot, Loader2, Send, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type TripAiChatProps = {
  tripId: string;
  locale: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export function TripAiChat({ tripId, locale: _locale }: TripAiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const chatMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await fetch(`/api/guide/trips/${tripId}/chat-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, type: 'chat' }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to get AI response');
      }
      
      const data = (await res.json()) as { response: string };
      return data.response;
    },
    onSuccess: (response, question) => {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: question, timestamp: new Date() },
        { role: 'assistant', content: response, timestamp: new Date() },
      ]);
      setInput('');
    },
    onError: (error: Error) => {
      console.error('Chat AI error:', error);
      toast.error(error.message || 'Gagal mengirim pesan. Silakan coba lagi.');
      // Still show user message even if AI fails
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: input.trim(), timestamp: new Date() },
        {
          role: 'assistant',
          content: 'Maaf, terjadi kesalahan. Silakan coba lagi atau hubungi support.',
          timestamp: new Date(),
        },
      ]);
      setInput('');
    },
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    chatMutation.mutate(input.trim());
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full bg-emerald-600 shadow-lg hover:bg-emerald-700"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-24 right-4 z-40 h-[500px] w-[350px] shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Bot className="h-4 w-4 text-emerald-600" />
          AI Trip Assistant
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex h-[calc(500px-4rem)] flex-col p-0">
        <div className="flex-1 overflow-y-auto px-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 && (
              <div className="text-center text-sm text-slate-500">
                <p>Tanyakan apapun tentang trip ini</p>
                <p className="mt-2 text-xs">Contoh: "Berapa jumlah penumpang yang sudah naik?"</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-slate-600">Memproses...</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="border-t p-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Tanyakan sesuatu..."
              className="flex-1 text-sm"
              disabled={chatMutation.isPending}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
