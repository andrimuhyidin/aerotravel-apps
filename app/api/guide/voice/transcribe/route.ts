/**
 * API: Voice Transcription
 * POST /api/guide/voice/transcribe
 * 
 * Transcribe audio file to text using Google Speech-to-Text API
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { transcribeAudio, validateAudioFile } from '@/lib/ai/voice-transcription';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const languageCode = (formData.get('languageCode') as string) || 'id-ID';

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Validate audio file
    const validation = validateAudioFile(audioFile);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    logger.info('Starting audio transcription', {
      guideId: user.id,
      fileName: audioFile.name,
      fileSize: audioFile.size,
      mimeType: audioFile.type,
      languageCode,
    });

    // Transcribe audio
    const result = await transcribeAudio(audioBuffer, audioFile.type, languageCode);

    logger.info('Audio transcription completed', {
      guideId: user.id,
      textLength: result.text.length,
      confidence: result.confidence,
      duration: result.duration,
    });

    return NextResponse.json({
      success: true,
      transcription: result.text,
      confidence: result.confidence,
      language: result.language,
      duration: result.duration,
    });
  } catch (error) {
    logger.error('Failed to transcribe audio', error, { guideId: user.id });
    
    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio';
    
    // Check if it's an API key error
    if (errorMessage.includes('API key') || errorMessage.includes('environment variable')) {
      return NextResponse.json(
        { error: 'Speech-to-text service is not configured. Please contact administrator.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio. Please try again.' },
      { status: 500 }
    );
  }
});

