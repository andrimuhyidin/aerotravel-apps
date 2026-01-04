/**
 * Client-side article view tracking
 * Separated from server-only articles.ts for client component usage
 */

/**
 * Increment article views
 * Called when article is viewed (client-side)
 */
export async function incrementArticleViews(articleId: string): Promise<void> {
  try {
    const response = await fetch(`/api/blog/articles/${articleId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to increment views');
    }
  } catch (error) {
    // Silent fail - don't break page if tracking fails
    console.warn('Error incrementing article views', error);
  }
}

