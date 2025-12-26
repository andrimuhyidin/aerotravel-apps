/**
 * Retry Hook
 * Hook untuk retry failed API calls dengan exponential backoff
 */

import { useState, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

export function useRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onError?: (error: Error, attempt: number) => void;
  } = {}
) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onError,
  } = options;

  const [retrying, setRetrying] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(async (): Promise<T> => {
    setRetrying(true);
    let currentAttempt = 0;

    while (currentAttempt <= maxRetries) {
      try {
        setAttempt(currentAttempt);
        const result = await fn();
        setRetrying(false);
        setAttempt(0);
        return result;
      } catch (error) {
        currentAttempt++;

        if (currentAttempt > maxRetries) {
          setRetrying(false);
          setAttempt(0);
          if (onError) {
            onError(error as Error, currentAttempt);
          }
          throw error;
        }

        // Exponential backoff
        const delay = Math.min(
          initialDelay * Math.pow(2, currentAttempt - 1),
          maxDelay
        );

        logger.warn('Retry attempt failed', {
          attempt: currentAttempt,
          maxRetries,
          delay,
          error: error instanceof Error ? error.message : String(error),
        });

        if (onError) {
          onError(error as Error, currentAttempt);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    setRetrying(false);
    setAttempt(0);
    throw new Error('Max retries exceeded');
  }, [fn, maxRetries, initialDelay, maxDelay, onError]);

  return { retry, retrying, attempt };
}

