'use client';

import { useEffect, useRef } from 'react';

import { incrementArticleViews } from '@/lib/blog/article-views';

/**
 * Client component untuk track article views
 * Call API ketika artikel dibuka
 */
export function ArticleViewTracker({ articleId }: { articleId: string }) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Track view (fire and forget)
    incrementArticleViews(articleId).catch((error) => {
      // Silent fail - don't break page if tracking fails
      console.warn('Failed to track article view', error);
    });
  }, [articleId]);

  return null;
}

