/**
 * Voice Command Floating Action Button
 * Hands-free voice control for Guide App
 * Uses /api/guide/voice/command and /api/guide/voice/transcribe APIs
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';

type VoiceCommand = {
  intent: string;
  action: string;
  parameters: Record<string, unknown>;
  confidence: number;
};

type CommandAction = {
  endpoint: string;
  method: 'GET' | 'POST';
  payload?: Record<string, unknown>;
};

type VoiceCommandFABProps = {
  locale?: string;
  tripId?: string;
  onCommandExecuted?: (command: VoiceCommand, result: unknown) => void;
};

export function VoiceCommandFAB({
  locale: _locale = 'id',
  tripId,
  onCommandExecuted,
}: VoiceCommandFABProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Only show on home page
  const isHomePage = pathname?.endsWith('/guide/home') || pathname?.endsWith('/guide');
  
  if (!isHomePage) {
    return null;
  }
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandResult, setCommandResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const {
    isRecording,
    isTranscribing,
    transcript,
    audioBlob,
    duration,
    error,
    startRecording,
    stopRecording,
    transcribe,
    clearTranscript,
  } = useVoiceRecorder({
    languageCode: 'id-ID',
    onError: (err) => {
      logger.error('Voice recording error', err);
      toast.error('Gagal merekam suara: ' + err.message);
    },
  });

  // Auto-transcribe when recording stops
  useEffect(() => {
    if (!isRecording && audioBlob && !isTranscribing && !transcript) {
      void transcribe();
    }
  }, [isRecording, audioBlob, isTranscribing, transcript, transcribe]);

  // Process command after transcription
  useEffect(() => {
    if (transcript && !isProcessing && !commandResult) {
      void processCommand(transcript);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  const processCommand = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    try {
      // Get current location if available
      let location: { lat: number; lng: number } | undefined;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            });
          });
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch {
          // Location not available, continue without it
        }
      }

      // Send to command API
      const res = await fetch('/api/guide/voice/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          tripId,
          location,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal memproses perintah');
      }

      const data = (await res.json()) as { command: VoiceCommand; action: CommandAction };
      const { command, action } = data;

      // Execute the action
      const actionResult = await executeAction(action);

      setCommandResult({
        success: true,
        message: getSuccessMessage(command.intent),
      });

      if (onCommandExecuted) {
        onCommandExecuted(command, actionResult);
      }

      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      logger.error('Failed to process voice command', err);
      setCommandResult({
        success: false,
        message: err instanceof Error ? err.message : 'Gagal memproses perintah',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeAction = async (action: CommandAction): Promise<unknown> => {
    const res = await fetch(action.endpoint, {
      method: action.method,
      headers: action.method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
      body: action.method === 'POST' && action.payload ? JSON.stringify(action.payload) : undefined,
    });

    if (!res.ok) {
      const errorData = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(errorData.error || 'Action failed');
    }

    return res.json();
  };

  const getSuccessMessage = (intent: string): string => {
    switch (intent) {
      case 'check_status':
        return 'Status trip berhasil dicek';
      case 'check_manifest':
        return 'Manifest berhasil dicek';
      case 'check_weather':
        return 'Cuaca berhasil dicek';
      case 'sos':
        return 'SOS telah dikirim!';
      case 'add_expense':
        return 'Pengeluaran berhasil dicatat';
      default:
        return 'Perintah berhasil dijalankan';
    }
  };

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setCommandResult(null);
    clearTranscript();
  }, [clearTranscript]);

  const handleClose = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
    setIsOpen(false);
    setCommandResult(null);
    clearTranscript();
  }, [isRecording, stopRecording, clearTranscript]);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      setCommandResult(null);
      clearTranscript();
      void startRecording();
    }
  }, [isRecording, stopRecording, startRecording, clearTranscript]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* FAB Button - positioned within mobile wrapper, left side above bottom nav */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-[88px] left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4 pointer-events-none"
          >
            <Button
              size="lg"
              className={cn(
                'pointer-events-auto h-11 gap-2 rounded-full px-4 shadow-lg',
                'bg-gradient-to-br from-emerald-500 to-emerald-600',
                'hover:from-emerald-600 hover:to-emerald-700',
                'text-white font-medium text-sm'
              )}
              onClick={handleOpen}
            >
              <Mic className="h-4 w-4" />
              Perintah Suara
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Command Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg"
            >
              <div className="rounded-t-3xl bg-white shadow-2xl">
                {/* Handle bar */}
                <div className="flex justify-center pt-3">
                  <div className="h-1 w-12 rounded-full bg-slate-300" />
                </div>

                {/* Close Button */}
                <div className="absolute right-4 top-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full bg-slate-100 p-0 hover:bg-slate-200"
                    onClick={handleClose}
                  >
                    <X className="h-5 w-5 text-slate-600" />
                  </Button>
                </div>

                <div className="px-6 pb-8 pt-4">
                  {/* Title */}
                  <div className="mb-6 text-center">
                    <h3 className="text-lg font-semibold text-slate-900">
                      🎤 Perintah Suara
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Tekan tombol mikrofon lalu ucapkan perintah
                    </p>
                  </div>

                {/* Voice Visualization / Status */}
                <div className="mb-6 flex flex-col items-center">
                  {/* Recording Indicator */}
                  {isRecording && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mb-4"
                    >
                      <div className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        <span className="text-sm font-medium text-red-700">
                          Merekam... {formatDuration(duration)}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Processing States */}
                  {isTranscribing && (
                    <div className="mb-4 flex items-center gap-2 text-slate-600">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Mentranskrip audio...</span>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="mb-4 flex items-center gap-2 text-slate-600">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Memproses perintah...</span>
                    </div>
                  )}

                  {/* Result */}
                  {commandResult && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        'mb-4 flex items-center gap-2 rounded-full px-4 py-2',
                        commandResult.success
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      )}
                    >
                      {commandResult.success ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <X className="h-5 w-5" />
                      )}
                      <span className="text-sm font-medium">{commandResult.message}</span>
                    </motion.div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-3 text-center">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Transcript */}
                  {transcript && !commandResult && (
                    <div className="mb-4 w-full rounded-lg bg-slate-100 p-3">
                      <p className="text-center text-sm text-slate-700">
                        &ldquo;{transcript}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Mic Button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleRecording}
                    disabled={isTranscribing || isProcessing}
                    className={cn(
                      'flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-colors',
                      isRecording
                        ? 'bg-red-500 text-white'
                        : isTranscribing || isProcessing
                          ? 'bg-slate-200 text-slate-400'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    )}
                  >
                    {isRecording ? (
                      <MicOff className="h-8 w-8" />
                    ) : isTranscribing || isProcessing ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                      <Mic className="h-8 w-8" />
                    )}
                  </motion.button>

                  {/* Recording animation rings */}
                  {isRecording && (
                    <>
                      <motion.div
                        className="absolute h-24 w-24 rounded-full border-2 border-red-300"
                        animate={{
                          scale: [1, 1.5],
                          opacity: [0.5, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                        }}
                      />
                      <motion.div
                        className="absolute h-24 w-24 rounded-full border-2 border-red-300"
                        animate={{
                          scale: [1, 1.5],
                          opacity: [0.5, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: 0.5,
                        }}
                      />
                    </>
                  )}
                </div>

                {/* Example Commands */}
                <div className="space-y-3">
                  <p className="text-center text-xs font-medium text-slate-500">
                    Contoh perintah:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { cmd: 'Cek status trip', icon: '📋' },
                      { cmd: 'Cek manifest', icon: '👥' },
                      { cmd: 'Cek cuaca', icon: '🌤️' },
                      { cmd: 'Tambah pengeluaran', icon: '💰' },
                    ].map(({ cmd, icon }) => (
                      <button
                        key={cmd}
                        type="button"
                        onClick={() => void processCommand(cmd)}
                        disabled={isRecording || isTranscribing || isProcessing}
                        className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
                      >
                        <span className="text-base">{icon}</span>
                        <span className="font-medium">{cmd}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

