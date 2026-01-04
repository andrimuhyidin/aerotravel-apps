/**
 * Voice Recorder Hook
 * Client-side hook for recording audio and transcribing to text
 * Uses Web Speech API for real-time transcription (optional) or API endpoint for server-side transcription
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '@/lib/utils/logger';

export type VoiceRecorderState = {
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: string;
  error: string | null;
  audioBlob: Blob | null;
  duration: number; // in seconds
};

export type UseVoiceRecorderOptions = {
  onTranscript?: (transcript: string) => void;
  onError?: (error: Error) => void;
  languageCode?: string; // e.g., 'id-ID', 'en-US'
  useWebSpeechAPI?: boolean; // Use browser's Web Speech API for real-time transcription (optional)
};

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const {
    onTranscript,
    onError,
    languageCode = 'id-ID',
    useWebSpeechAPI = false, // Default to server-side transcription for better accuracy
  } = options;

  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    isTranscribing: false,
    transcript: '',
    error: null,
    audioBlob: null,
    duration: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Web Speech API setup (for real-time transcription)
  useEffect(() => {
    if (!useWebSpeechAPI || typeof window === 'undefined') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      logger.warn('Web Speech API not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognitionConstructor() as SpeechRecognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = languageCode;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = state.transcript;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result || result.length === 0) continue;
        
        const alternative = result[0];
        if (!alternative) continue;
        
        const transcript = alternative.transcript;
        if (result.isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = finalTranscript + interimTranscript;
      setState((prev) => ({ ...prev, transcript: fullTranscript.trim() }));

      if (onTranscript && finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const error = new Error(`Speech recognition error: ${event.error}`);
      logger.warn('Speech recognition error', { error: event.error });
      setState((prev) => ({ ...prev, error: error.message }));
      if (onError) {
        onError(error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still recording
      if (state.isRecording && useWebSpeechAPI) {
        try {
          recognition.start();
        } catch (err) {
          // Already started or other error, ignore
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore errors on cleanup
        }
      }
    };
  }, [useWebSpeechAPI, languageCode, state.isRecording, state.transcript, onTranscript, onError]);

  const startRecording = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null, transcript: '', audioBlob: null }));

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setState((prev) => ({ ...prev, audioBlob }));
      };

      mediaRecorder.onerror = (event) => {
        const error = new Error('MediaRecorder error');
        logger.error('MediaRecorder error', { error: event });
        setState((prev) => ({ ...prev, error: error.message, isRecording: false }));
        if (onError) {
          onError(error);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every 1 second
      startTimeRef.current = Date.now();

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setState((prev) => ({ ...prev, duration }));
        }
      }, 1000);

      // Start Web Speech API recognition if enabled
      if (useWebSpeechAPI && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          // Already started or other error, continue without real-time transcription
          logger.warn('Failed to start Web Speech API', { error: err });
        }
      }

      setState((prev) => ({ ...prev, isRecording: true }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start recording');
      logger.error('Failed to start voice recording', { error: err });
      setState((prev) => ({ ...prev, error: err.message, isRecording: false }));
      if (onError) {
        onError(err instanceof Error ? err : new Error('Unknown error'));
      }
    }
  }, [useWebSpeechAPI, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (recognitionRef.current && useWebSpeechAPI) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    setState((prev) => ({ ...prev, isRecording: false }));
  }, [state.isRecording, useWebSpeechAPI]);

  const transcribe = useCallback(async () => {
    if (!state.audioBlob) {
      setState((prev) => ({ ...prev, error: 'No audio recorded' }));
      return;
    }

    setState((prev) => ({ ...prev, isTranscribing: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('audio', state.audioBlob, 'recording.webm');
      formData.append('languageCode', languageCode);

      const response = await fetch('/api/guide/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to transcribe audio' }));
        throw new Error(errorData.error || 'Failed to transcribe audio');
      }

      const data = await response.json();

      const transcript = data.transcription || '';
      setState((prev) => ({ ...prev, transcript, isTranscribing: false }));

      if (onTranscript && transcript) {
        onTranscript(transcript);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to transcribe audio');
      logger.error('Failed to transcribe audio', { error: err });
      setState((prev) => ({ ...prev, error: err.message, isTranscribing: false }));
      if (onError) {
        onError(err);
      }
    }
  }, [state.audioBlob, languageCode, onTranscript, onError]);

  const clearTranscript = useCallback(() => {
    setState((prev) => ({
      ...prev,
      transcript: '',
      audioBlob: null,
      duration: 0,
      error: null,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [stopRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    transcribe,
    clearTranscript,
  };
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition?: any;
  }
}

// Web Speech API types (outside global to avoid conflicts)
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult | undefined;
  [index: number]: SpeechRecognitionResult | undefined;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative | undefined;
  [index: number]: SpeechRecognitionAlternative | undefined;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

