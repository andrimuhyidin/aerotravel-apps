/**
 * API: Voice Transcription
 * POST /api/guide/voice/transcribe
 * 
 * Transcribe audio file to text using Google Speech-to-Text API
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
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
    const incidentId = formData.get('incidentId') as string | null;

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
      incidentId,
    });

    // Upload audio file to storage (optional, for audit)
    let audioFileUrl: string | null = null;
    try {
      const branchContext = await getBranchContext(user.id);
      const client = supabase as unknown as any;
      
      // Upload to Supabase Storage
      const fileExt = audioFile.name.split('.').pop() || 'webm';
      const fileName = `voice-logs/${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await client.storage
        .from('guide-uploads')
        .upload(fileName, audioBuffer, {
          contentType: audioFile.type,
          upsert: false,
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = client.storage
          .from('guide-uploads')
          .getPublicUrl(fileName);
        audioFileUrl = urlData?.publicUrl || null;
      }
    } catch (uploadErr) {
      logger.warn('Failed to upload audio file for audit', { 
        error: uploadErr instanceof Error ? uploadErr.message : String(uploadErr),
        guideId: user.id 
      });
      // Continue without file URL
    }

    // Transcribe audio
    const result = await transcribeAudio(audioBuffer, audioFile.type, languageCode);

    // Log transcription to audit table
    try {
      const branchContext = await getBranchContext(user.id);
      const client = supabase as unknown as any;

      await withBranchFilter(
        client.from('incident_voice_logs'),
        branchContext,
      ).insert({
        incident_id: incidentId || null,
        guide_id: user.id,
        branch_id: branchContext.branchId,
        audio_file_url: audioFileUrl,
        transcript: result.text,
        confidence_score: result.confidence,
        language: result.language,
        duration_seconds: Math.round(result.duration),
        transcription_method: 'google_speech',
      } as never);
    } catch (logError) {
      logger.error('Failed to log voice transcription', logError, { guideId: user.id });
      // Don't fail the request if logging fails
    }

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

