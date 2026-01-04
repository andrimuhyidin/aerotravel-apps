/**
 * User Feedback Collection System
 * Allows users to submit bug reports, feature requests, and general feedback
 */

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';
import { z } from 'zod';

export const feedbackSchema = z.object({
  feedbackType: z.enum(['bug', 'feature_request', 'general', 'complaint', 'praise']),
  category: z.enum(['ui_ux', 'performance', 'functionality', 'content', 'other']).optional(),
  title: z.string().min(5, 'Judul minimal 5 karakter').max(200, 'Judul maksimal 200 karakter'),
  description: z.string().min(20, 'Deskripsi minimal 20 karakter').max(2000, 'Deskripsi maksimal 2000 karakter'),
  userEmail: z.string().email('Email tidak valid').optional(),
  userName: z.string().max(100).optional(),
  screenshots: z.array(z.string().url()).max(5, 'Maksimal 5 screenshot').optional(),
});

export type FeedbackPayload = z.infer<typeof feedbackSchema>;

export interface FeedbackSubmitResult {
  success: boolean;
  feedbackId?: string;
  error?: string;
}

/**
 * Submit user feedback
 */
export async function submitFeedback(
  payload: FeedbackPayload
): Promise<FeedbackSubmitResult> {
  try {
    // Validate payload
    const validated = feedbackSchema.parse(payload);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get device info
    const deviceInfo = {
      screenWidth: typeof window !== 'undefined' ? window.screen.width : null,
      screenHeight: typeof window !== 'undefined' ? window.screen.height : null,
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : null,
      viewportHeight: typeof window !== 'undefined' ? window.innerHeight : null,
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : null,
      touchSupport: typeof window !== 'undefined' ? 'ontouchstart' in window : null,
    };

    const feedbackData = {
      user_id: user?.id || null,
      user_email: validated.userEmail || user?.email || null,
      user_name: validated.userName || null,
      feedback_type: validated.feedbackType,
      category: validated.category || null,
      title: validated.title,
      description: validated.description,
      screenshots: validated.screenshots || [],
      page_url: typeof window !== 'undefined' ? window.location.href : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      device_info: deviceInfo,
      status: 'new',
      priority: 'medium',
    };

    const { data, error } = await supabase
      .from('user_feedback')
      .insert(feedbackData)
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to submit feedback', error, { feedbackData });
      return {
        success: false,
        error: 'Gagal mengirim feedback. Silakan coba lagi.',
      };
    }

    logger.info('Feedback submitted successfully', { feedbackId: data.id });

    return {
      success: true,
      feedbackId: data.id,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Data tidak valid',
      };
    }

    logger.error('Error submitting feedback', error, { payload });
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi.',
    };
  }
}

/**
 * React Hook for feedback submission
 */
export function useFeedbackSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (payload: FeedbackPayload): Promise<FeedbackSubmitResult> => {
    setIsSubmitting(true);

    try {
      const result = await submitFeedback(payload);

      if (result.success) {
        toast.success('Feedback berhasil dikirim', {
          description: 'Terima kasih atas feedback Anda. Tim kami akan segera meninjau.',
        });
      } else {
        toast.error('Gagal mengirim feedback', {
          description: result.error,
        });
      }

      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting };
}

/**
 * Quick feedback for specific features (e.g., "Was this helpful?")
 */
export async function submitQuickFeedback(
  featureName: string,
  isPositive: boolean,
  comment?: string
): Promise<FeedbackSubmitResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const feedbackData = {
      user_id: user?.id || null,
      feedback_type: isPositive ? 'praise' : 'general',
      category: 'functionality',
      title: `Quick Feedback: ${featureName}`,
      description: comment || (isPositive ? 'Fitur ini membantu' : 'Fitur ini tidak membantu'),
      page_url: typeof window !== 'undefined' ? window.location.href : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      device_info: {
        featureName,
        isPositive,
      },
      status: 'new',
      priority: 'low',
    };

    const { data, error } = await supabase
      .from('user_feedback')
      .insert(feedbackData)
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to submit quick feedback', error);
      return { success: false, error: 'Gagal mengirim feedback' };
    }

    return { success: true, feedbackId: data.id };
  } catch (error) {
    logger.error('Error submitting quick feedback', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

/**
 * Upvote existing feedback
 */
export async function upvoteFeedback(feedbackId: string): Promise<boolean> {
  try {
    const supabase = createClient();

    const { error } = await supabase.rpc('increment_feedback_upvotes', {
      feedback_id: feedbackId,
    });

    if (error) {
      // If function doesn't exist, fallback to direct update
      const { error: updateError } = await supabase
        .from('user_feedback')
        .update({ upvotes: supabase.rpc('upvotes + 1') as unknown as number })
        .eq('id', feedbackId);

      if (updateError) {
        logger.error('Failed to upvote feedback', updateError);
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('Error upvoting feedback', error);
    return false;
  }
}

/**
 * Get user's feedback history
 */
export async function getUserFeedbackHistory() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Failed to get feedback history', error);
      return [];
    }

    return data;
  } catch (error) {
    logger.error('Error getting feedback history', error);
    return [];
  }
}

/**
 * Capture screenshot for feedback
 */
export async function captureScreenshot(): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !('html2canvas' in window)) {
      logger.warn('html2canvas not available');
      return null;
    }

    // Dynamic import to avoid SSR issues
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(document.body, {
      allowTaint: true,
      useCORS: true,
      logging: false,
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    logger.error('Error capturing screenshot', error);
    return null;
  }
}

