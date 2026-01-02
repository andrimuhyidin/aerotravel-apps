/**
 * Article Content Renderer
 * Renders markdown/rich content with proper styling
 */

'use client';

import { useEffect } from 'react';

type ArticleContentProps = {
  content: string;
  className?: string;
};

export function ArticleContent({ content, className = '' }: ArticleContentProps) {
  useEffect(() => {
    // Lazy load markdown parser if needed
    // For now, we render as HTML
  }, []);

  return (
    <div
      className={`prose prose-slate max-w-none dark:prose-invert
        prose-headings:font-bold prose-headings:text-foreground
        prose-h1:text-3xl prose-h1:mb-4
        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3
        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2
        prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-foreground prose-strong:font-semibold
        prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
        prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
        prose-li:text-muted-foreground prose-li:mb-1
        prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
        prose-img:rounded-lg prose-img:shadow-md
        ${className}`}
      // Simple markdown-like rendering
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

