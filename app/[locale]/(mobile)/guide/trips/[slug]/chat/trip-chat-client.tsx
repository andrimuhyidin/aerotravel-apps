'use client';

/**
 * Trip Chat Client Component
 * Chat interface untuk komunikasi Guide ↔ Ops per trip
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Paperclip, Send, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Textarea } from '@/components/ui/textarea';
import { queueMutation } from '@/lib/guide/offline-sync';
import queryKeys from '@/lib/queries/query-keys';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type ChatMessage = {
  id: string;
  senderId: string;
  senderRole: 'guide' | 'ops' | 'admin';
  messageText: string;
  templateType?: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentFilename?: string | null;
  createdAt: string;
  senderName: string;
  senderAvatar: string | null;
  isPending?: boolean; // Flag for queued messages
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

export function TripChatClient({ locale: _locale, tripId }: TripChatClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageText, setMessageText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch messages with infinite scroll pagination
  const {
    data,
    isLoading,
    error: fetchError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<{
    messages: ChatMessage[];
    hasMore: boolean;
    nextCursor: string | null;
    totalCount: number;
  }>({
    queryKey: [...queryKeys.guide.tripsDetail(tripId), 'chat'],
    queryFn: async ({ pageParam }) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/fd0e7040-6dec-4c80-af68-824474150b64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/(mobile)/guide/trips/[slug]/chat/trip-chat-client.tsx:91',message:'Starting fetch messages',data:{tripId,hasPageParam:!!pageParam},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      const url = new URL(`/api/guide/trips/${tripId}/chat`, window.location.origin);
      if (pageParam) {
        url.searchParams.set('cursor', pageParam as string);
      }
      url.searchParams.set('limit', '50');
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/fd0e7040-6dec-4c80-af68-824474150b64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/(mobile)/guide/trips/[slug]/chat/trip-chat-client.tsx:99',message:'Fetching messages',data:{url:url.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      const res = await fetch(url.toString());
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/fd0e7040-6dec-4c80-af68-824474150b64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/(mobile)/guide/trips/[slug]/chat/trip-chat-client.tsx:103',message:'Fetch response received',data:{status:res.status,statusText:res.statusText,ok:res.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      if (!res.ok) {
        let errorData: { error?: string } = { error: 'Unknown error' };
        try {
          const text = await res.text();
          errorData = text ? JSON.parse(text) : { error: `HTTP ${res.status}: ${res.statusText}` };
        } catch (e) {
          errorData = { error: `HTTP ${res.status}: ${res.statusText}` };
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/fd0e7040-6dec-4c80-af68-824474150b64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/(mobile)/guide/trips/[slug]/chat/trip-chat-client.tsx:112',message:'Fetch error detected',data:{status:res.status,statusText:res.statusText,errorData,url:url.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
        // #endregion

        throw new Error(errorData.error || `Failed to load messages (${res.status})`);
      }
      
      let responseData: {
        messages: ChatMessage[];
        hasMore: boolean;
        nextCursor: string | null;
        totalCount: number;
      };
      
      try {
        const text = await res.text();
        responseData = text ? JSON.parse(text) : { messages: [], hasMore: false, nextCursor: null, totalCount: 0 };
      } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/fd0e7040-6dec-4c80-af68-824474150b64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/(mobile)/guide/trips/[slug]/chat/trip-chat-client.tsx:125',message:'JSON parse error',data:{error:e instanceof Error ? e.message : String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        throw new Error('Invalid response format from server');
      }

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/fd0e7040-6dec-4c80-af68-824474150b64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/[locale]/(mobile)/guide/trips/[slug]/chat/trip-chat-client.tsx:130',message:'Messages fetched successfully',data:{messagesCount:responseData.messages?.length || 0,hasMore:responseData.hasMore,hasMessages:!!responseData.messages,hasNextCursor:!!responseData.nextCursor},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      return responseData;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    retry: 2,
  });

  // Flatten messages from all pages (oldest to newest for display)
  const messages = data?.pages.flatMap((page) => page.messages) || [];

  // Set up Supabase Realtime subscription for new messages
  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`trip-chat-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_chat_messages',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          logger.info('[Chat] New message received via Realtime', { tripId, messageId: payload.new.id });
          
          // Invalidate query to refetch messages (or manually add the new message)
          void queryClient.invalidateQueries({ 
            queryKey: [...queryKeys.guide.tripsDetail(tripId), 'chat'] 
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('[Chat] Realtime subscription active', { tripId });
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('[Chat] Realtime subscription error', { tripId, status });
        }
      });

    // Cleanup subscription on unmount
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId, supabase, queryClient]);

  // Send message mutation with offline support and file upload
  const sendMutation = useMutation({
    mutationFn: async ({ 
      text, 
      templateType, 
      file 
    }: { 
      text: string; 
      templateType?: string;
      file?: File | null;
    }) => {
      // Check online status
      const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
      
      if (!isOnline) {
        // Queue message for offline sync (files not supported offline yet)
        if (file) {
          throw new Error('File uploads require internet connection. Please connect to internet and try again.');
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Get user role to determine sender role
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        const userRole = (userProfile as { role: string } | null)?.role || 'guide';
        let senderRole: 'guide' | 'ops' | 'admin' = 'guide';
        if (userRole === 'ops' || userRole === 'admin' || userRole === 'super_admin') {
          senderRole = userRole === 'admin' || userRole === 'super_admin' ? 'admin' : 'ops';
        }

        // Queue message
        await queueMutation('CHAT_MESSAGE', {
          tripId,
          messageText: text,
          templateType: templateType || 'custom',
          senderRole,
        });

        // Return a temporary message object for UI
        return {
          success: true,
          message: {
            id: `pending-${Date.now()}`,
            senderId: user.id,
            senderRole,
            messageText: text,
            templateType: templateType || 'custom',
            createdAt: new Date().toISOString(),
            senderName: 'You',
            senderAvatar: null,
            isPending: true, // Flag for UI
          },
        };
      }

      // Online: send immediately (with or without file)
      if (file) {
        // Send with file (FormData)
        const formData = new FormData();
        formData.append('messageText', text);
        if (templateType) {
          formData.append('templateType', templateType);
        }
        formData.append('file', file);

        const res = await fetch(`/api/guide/trips/${tripId}/chat`, {
          method: 'POST',
          body: formData, // Don't set Content-Type header, browser will set it with boundary
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          
          // Handle rate limit error (429)
          if (res.status === 429) {
            const retryAfter = res.headers.get('Retry-After');
            const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
            throw new Error(
              `Terlalu banyak pesan. Silakan tunggu ${retrySeconds} detik sebelum mengirim pesan lagi.`
            );
          }
          
          throw new Error(errorData.error || 'Failed to send message');
        }
        
        return (await res.json()) as { success: boolean; message: ChatMessage };
      } else {
        // Send text only (JSON)
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
          
          // Handle rate limit error (429)
          if (res.status === 429) {
            const retryAfter = res.headers.get('Retry-After');
            const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
            throw new Error(
              `Terlalu banyak pesan. Silakan tunggu ${retrySeconds} detik sebelum mengirim pesan lagi.`
            );
          }
          
          // If network error, try to queue
          if (!navigator.onLine) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data: userProfile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

              const userRole = (userProfile as { role: string } | null)?.role || 'guide';
              let senderRole: 'guide' | 'ops' | 'admin' = 'guide';
              if (userRole === 'ops' || userRole === 'admin' || userRole === 'super_admin') {
                senderRole = userRole === 'admin' || userRole === 'super_admin' ? 'admin' : 'ops';
              }

              await queueMutation('CHAT_MESSAGE', {
                tripId,
                messageText: text,
                templateType: templateType || 'custom',
                senderRole,
              });

              return {
                success: true,
                message: {
                  id: `pending-${Date.now()}`,
                  senderId: user.id,
                  senderRole,
                  messageText: text,
                  templateType: templateType || 'custom',
                  createdAt: new Date().toISOString(),
                  senderName: 'You',
                  senderAvatar: null,
                  isPending: true,
                },
              };
            }
          }
          
          throw new Error(errorData.error || 'Failed to send message');
        }
        
        return (await res.json()) as { success: boolean; message: ChatMessage };
      }
    },
    onSuccess: (data) => {
      setMessageText('');
      setShowTemplates(false);
      setSelectedFile(null);
      setFilePreview(null);
      
      if (data.message && 'isPending' in data.message && data.message.isPending) {
        toast.success('Pesan akan dikirim saat koneksi tersedia');
      } else {
        toast.success('Pesan terkirim');
      }
    },
    onError: (error: Error) => {
      logger.error('Send message error', error, { tripId });
      toast.error(error.message || 'Gagal mengirim pesan. Silakan coba lagi.');
    },
  });

  const handleSend = () => {
    if (!messageText.trim() && !selectedFile) return;
    sendMutation.mutate({ 
      text: messageText.trim() || '', 
      file: selectedFile || null 
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];

    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not allowed. Only images (JPG, PNG, WebP) and documents (PDF, DOC, DOCX) are supported.');
      return;
    }

    // Validate file size
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5MB
    const maxSize = allowedImageTypes.includes(file.type) ? MAX_IMAGE_SIZE : MAX_DOC_SIZE;

    if (file.size > maxSize) {
      toast.error(`File size exceeds maximum of ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (allowedImageTypes.includes(file.type)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setMessageText(template.message);
    setShowTemplates(false);
  };

  // Auto-scroll to bottom on new messages (only if user is near bottom)
  useEffect(() => {
    if (!messagesContainerRef.current || !messagesEndRef.current) return;
    
    const container = messagesContainerRef.current;
    const threshold = 150; // pixels from bottom
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    
    if (isNearBottom) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [messages.length]);

  // Infinite scroll: load more when scrolling to top
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasNextPage || isFetchingNextPage) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Load more when scrolled to top (within 150px)
        if (container.scrollTop < 150) {
          void fetchNextPage();
        }
      }, 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
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

      {/* Messages - Full height scrollable */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-slate-50 px-4 py-6"
      >
            {/* Loading indicator for pagination */}
            {isFetchingNextPage && (
              <div className="flex justify-center py-2">
                <div className="text-xs text-slate-500">Memuat pesan lama...</div>
              </div>
            )}
            
            {isLoading ? (
              <LoadingState />
            ) : fetchError ? (
              <ErrorState 
                message={fetchError instanceof Error ? fetchError.message : 'Gagal memuat pesan'} 
              />
            ) : messages.length === 0 ? (
              <EmptyState
                icon={Send}
                title="Belum ada pesan"
                description="Gunakan quick templates di bawah untuk memulai percakapan"
                variant="default"
              />
            ) : (
              messages.map((msg, index) => {
                const isGuide = msg.senderRole === 'guide';
                const isOps = msg.senderRole === 'ops' || msg.senderRole === 'admin';
                
                // Group consecutive messages from same sender
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const isSameSender = prevMsg?.senderId === msg.senderId;
                const showAvatar = !isSameSender;
                const showName = !isSameSender;
                
                // Format timestamp
                const msgDate = new Date(msg.createdAt);
                const prevDate = prevMsg ? new Date(prevMsg.createdAt) : null;
                const showDateSeparator = !prevDate || 
                  msgDate.toDateString() !== prevDate.toDateString();
                
                const timeStr = msgDate.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const dateStr = msgDate.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });

                return (
                  <div key={msg.id} className="space-y-2">
                    {/* Date Separator */}
                    {showDateSeparator && (
                      <div className="flex items-center justify-center py-2">
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                          {dateStr}
                        </div>
                      </div>
                    )}
                    
                    <div
                      className={cn(
                        'flex gap-2',
                        isGuide ? 'flex-row-reverse' : 'flex-row',
                        !showAvatar && (isGuide ? 'mr-11' : 'ml-11'), // Align with avatar space
                      )}
                    >
                      {/* Avatar - only show if different sender */}
                      {showAvatar && (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white shadow-sm">
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
                      )}
                      
                      {/* Message Content */}
                      <div className={cn(
                        'flex flex-1 flex-col max-w-[75%]',
                        isGuide ? 'items-end' : 'items-start',
                      )}>
                        {/* Sender Name - only show if different sender */}
                        {showName && (
                          <div className="mb-1 flex items-center gap-2 px-1">
                            <span className="text-xs font-semibold text-slate-700">
                              {isGuide ? 'Anda' : msg.senderName}
                            </span>
                            {isOps && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                Ops
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Message Bubble */}
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                            isGuide
                              ? 'bg-emerald-500 text-white rounded-br-sm'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-bl-sm',
                            msg.isPending && 'opacity-60',
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.messageText}</p>
                          {msg.isPending && (
                            <span className="mt-1 block text-xs opacity-75">
                              Menunggu koneksi...
                            </span>
                          )}
                        </div>
                        
                        {/* Attachment Display */}
                        {msg.attachmentUrl && (
                          <div className={cn(
                            'mt-2 max-w-full rounded-xl overflow-hidden shadow-sm',
                            isGuide ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-slate-200'
                          )}>
                            {msg.attachmentType === 'image' ? (
                              <a
                                href={msg.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={msg.attachmentUrl}
                                  alt={msg.attachmentFilename || 'Attachment'}
                                  className="max-h-64 w-full object-cover"
                                />
                              </a>
                            ) : (
                              <a
                                href={msg.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 hover:bg-slate-50 transition-colors"
                              >
                                <Paperclip className="h-4 w-4 text-slate-600" />
                                <span className="text-xs font-medium text-slate-700 truncate">
                                  {msg.attachmentFilename || 'Download attachment'}
                                </span>
                              </a>
                            )}
                          </div>
                        )}
                        
                        {/* Timestamp */}
                        <span className={cn(
                          'mt-1 px-1 text-[10px] text-slate-400',
                          isGuide ? 'text-right' : 'text-left',
                        )}>
                          {timeStr}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

      {/* Input Area - Sticky Bottom */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full text-xs"
        >
          {showTemplates ? 'Sembunyikan' : 'Tampilkan'} Quick Templates
        </Button>

        {/* File Preview */}
        {selectedFile && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
            {filePreview ? (
              <img
                src={filePreview}
                alt="Preview"
                className="h-12 w-12 rounded object-cover"
              />
            ) : (
              <Paperclip className="h-8 w-8 text-slate-400" />
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-slate-900">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            id="chat-file-input"
          />
          <label
            htmlFor="chat-file-input"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white hover:bg-slate-50 transition-colors flex-shrink-0"
          >
            <Paperclip className="h-5 w-5 text-slate-600" />
          </label>
          <div className="flex-1 min-w-0">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ketik pesan..."
              className="min-h-[44px] max-h-32 resize-none text-sm rounded-2xl border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={(!messageText.trim() && !selectedFile) || sendMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 h-10 w-10 rounded-full p-0 flex-shrink-0 disabled:opacity-50"
            size="lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
