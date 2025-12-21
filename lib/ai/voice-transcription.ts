/**
 * Voice Transcription Service
 * Speech-to-text using Google Speech-to-Text API
 * 
 * Alternative: Can also use Web Speech API on client-side for free (lower accuracy)
 */

import 'server-only';

import { logger } from '@/lib/utils/logger';

export type TranscriptionResult = {
  text: string;
  confidence: number;
  language: string;
  duration: number; // in seconds
};

/**
 * Transcribe audio file using Google Speech-to-Text API
 * @param audioBuffer - Audio file buffer
 * @param mimeType - Audio MIME type (e.g., 'audio/webm', 'audio/mp3')
 * @param languageCode - Language code (default: 'id-ID' for Indonesian)
 * @returns Transcribed text and confidence score
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string = 'audio/webm',
  languageCode: string = 'id-ID'
): Promise<TranscriptionResult> {
  try {
    const apiKey = process.env.GOOGLE_SPEECH_TO_TEXT_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      logger.warn('Google Speech-to-Text API key not found, returning empty transcription');
      throw new Error('GOOGLE_SPEECH_TO_TEXT_API_KEY or GEMINI_API_KEY environment variable is not set');
    }

    // Google Speech-to-Text API endpoint
    const apiUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;

    // Convert buffer to base64
    const audioBase64 = audioBuffer.toString('base64');

    const requestBody = {
      config: {
        encoding: getEncodingFromMimeType(mimeType),
        sampleRateHertz: 16000, // Default, can be auto-detected
        languageCode: languageCode,
        enableAutomaticPunctuation: true,
        model: 'latest_long', // Use latest_long for better accuracy on longer audio
        alternativeLanguageCodes: ['en-US'], // Support both Indonesian and English
      },
      audio: {
        content: audioBase64,
      },
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      logger.error('Google Speech-to-Text API error', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(`Speech-to-Text API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Extract transcription result
    if (!data.results || data.results.length === 0) {
      logger.warn('No transcription results from Speech-to-Text API');
      return {
        text: '',
        confidence: 0,
        language: languageCode,
        duration: 0,
      };
    }

    // Get the first alternative (highest confidence)
    const result = data.results[0];
    const alternative = result.alternatives?.[0];

    if (!alternative) {
      return {
        text: '',
        confidence: 0,
        language: languageCode,
        duration: 0,
      };
    }

    const transcribedText = alternative.transcript || '';
    const confidence = alternative.confidence || 0;

    // Estimate duration (rough calculation)
    // Speech-to-Text API doesn't return duration directly, estimate based on word count
    const wordsPerMinute = 150; // Average speaking rate
    const wordCount = transcribedText.split(/\s+/).length;
    const estimatedDuration = (wordCount / wordsPerMinute) * 60;

    logger.info('Audio transcribed successfully', {
      textLength: transcribedText.length,
      confidence,
      language: languageCode,
      estimatedDuration,
    });

    return {
      text: transcribedText,
      confidence,
      language: languageCode,
      duration: estimatedDuration,
    };
  } catch (error) {
    logger.error('Failed to transcribe audio', error);
    throw error;
  }
}

/**
 * Convert MIME type to Google Speech-to-Text encoding format
 */
function getEncodingFromMimeType(mimeType: string): string {
  const mimeToEncoding: Record<string, string> = {
    'audio/webm': 'WEBM_OPUS',
    'audio/webm;codecs=opus': 'WEBM_OPUS',
    'audio/webm;codecs=pcm': 'LINEAR16',
    'audio/mp3': 'MP3',
    'audio/mpeg': 'MP3',
    'audio/wav': 'LINEAR16',
    'audio/flac': 'FLAC',
    'audio/ogg': 'OGG_OPUS',
    'audio/ogg;codecs=opus': 'OGG_OPUS',
  };

  return mimeToEncoding[mimeType.toLowerCase()] || 'WEBM_OPUS';
}

/**
 * Validate audio file
 * @param file - Audio file
 * @returns true if valid
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/mp3',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported audio format. Supported: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size (max 10MB for audio)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${MAX_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

