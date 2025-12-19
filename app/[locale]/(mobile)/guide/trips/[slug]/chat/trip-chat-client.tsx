'use client';

/**
 * Trip Chat Client Component
 * Chat interface untuk komunikasi Guide ↔ Ops per trip
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Textarea } from '@/components/ui/textarea';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type ChatMessage = {
  id: string;
  senderId: string;
  senderRole: 'guide' | 'ops' | 'admin';
  messageText: string;
  templateType?: string;
  createdAt: string;
  senderName: string;
  senderAvatar: string | null;
};

type TripChatClientProps = {
  locale: string;
  tripId: string;
};

const QUICK_TEMPLATES = [
  {
    type: 'delay_guest' as const,
    label: 'Keterlambatan Tamu',
    message: 'Halo Ops, ada tamu yang terlambat datang. Mohon konfirmasi apakah perlu menunggu atau langsung berangkat?',
  },
  {
    type: 'bad_weather' as const,
    label: 'Cuaca Buruk',
    message: 'Halo Ops, kondisi cuaca saat ini kurang baik. Mohon instruksi apakah trip tetap berjalan atau ditunda?',
  },
  {
    type: 'boat_equipment_issue' as const,
    label: 'Masalah Kapal/Alat',
    message: 'Halo Ops, ada masalah dengan kapal/peralatan. Mohon bantuan atau instruksi lebih lanjut.',
  },
];

export function TripChatClient({ locale, tripId }: TripChatClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  // Fetch messages
  const { data, isLoading, error: fetchError } = useQuery<{ messages: ChatMessage[] }>({
    queryKey: [...queryKeys.guide.tripsDetail(tripId), 'chat'],
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/chat`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to load messages');
      }
      return (await res.json()) as { messages: ChatMessage[] };
    },
    refetchInterval: 5000, // Poll every 5 seconds
    retry: 2,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async ({ text, templateType }: { text: string; templateType?: string }) => {
      const res = await fetch(`/api/guide/trips/${tripId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText: text,
          templateType,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      return (await res.json()) as { success: boolean; message: ChatMessage };
    },
    onSuccess: () => {
      setMessageText('');
      setShowTemplates(false);
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.guide.tripsDetail(tripId), 'chat'] });
      toast.success('Pesan terkirim');
    },
    onError: (error: Error) => {
      console.error('Send message error:', error);
      toast.error(error.message || 'Gagal mengirim pesan. Silakan coba lagi.');
    },
  });

  const handleSend = () => {
    if (!messageText.trim()) return;
    sendMutation.mutate({ text: messageText.trim() });
  };

  const handleTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setMessageText(template.message);
    setShowTemplates(false);
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

  const messages = data?.messages || [];

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col pb-6">
      {/* Header */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-2 text-sm text-emerald-600 hover:text-emerald-700"
        >
          ← Kembali
        </button>
        <h1 className="text-xl font-bold leading-tight text-slate-900">Chat Trip</h1>
        <p className="mt-1 text-sm text-slate-600">Komunikasi dengan Ops untuk trip ini</p>
      </div>

      {/* Quick Templates */}
      {showTemplates && (
        <Card className="mb-3 border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="mb-2 text-xs font-semibold text-slate-600">Quick Templates:</div>
            <div className="space-y-2">
              {QUICK_TEMPLATES.map((template) => (
                <button
                  key={template.type}
                  type="button"
                  onClick={() => handleTemplate(template)}
                  className="block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-left text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="font-medium text-slate-900">{template.label}</div>
                  <div className="mt-1 text-slate-600 line-clamp-2">{template.message}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <Card className="mb-3 flex-1 border-0 shadow-sm">
        <CardContent className="flex h-full flex-col p-0">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {isLoading ? (
              <LoadingState />
            ) : fetchError ? (
              <ErrorState 
                message={fetchError instanceof Error ? fetchError.message : 'Gagal memuat pesan'} 
              />
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-medium text-slate-600">Belum ada pesan</p>
                <p className="mt-1 text-xs text-slate-500">
                  Gunakan quick templates di bawah untuk memulai percakapan
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isGuide = msg.senderRole === 'guide';
                const isOps = msg.senderRole === 'ops' || msg.senderRole === 'admin';

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-3',
                      isGuide ? 'flex-row-reverse' : 'flex-row',
                    )}
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">
                      {msg.senderAvatar ? (
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        msg.senderName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className={cn('flex flex-1 flex-col', isGuide ? 'items-end' : 'items-start')}>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-700">{msg.senderName}</span>
                        {isOps && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                            Ops
                          </span>
                        )}
                      </div>
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                          isGuide
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-900',
                        )}
                      >
                        {msg.messageText}
                      </div>
                      <span className="mt-1 text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Input Area */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full text-xs"
        >
          {showTemplates ? 'Sembunyikan' : 'Tampilkan'} Quick Templates
        </Button>
        <div className="flex gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ketik pesan atau gunakan quick template..."
            className="min-h-[60px] flex-1 resize-none text-sm"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || sendMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
            size="lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
