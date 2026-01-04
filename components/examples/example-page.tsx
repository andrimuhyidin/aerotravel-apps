/**
 * Example Page Component
 * Demonstrates design system usage
 */

'use client';

import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { LoadingSpinner } from '@/components/ui/loading';
import { useIsMobile } from '@/hooks/use-media-query';

export function ExamplePage() {
  const isMobile = useIsMobile();

  return (
    <div>
      <Section spacing="lg">
        <Container>
          <h1 className="text-4xl font-bold mb-4">Example Page</h1>
          <p className="text-lg text-muted-foreground mb-8">
            This is an example page demonstrating the design system.
          </p>

          {/* Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 bg-card border rounded-lg shadow-sm"
              >
                <h3 className="text-xl font-semibold mb-2">Card {i}</h3>
                <p className="text-muted-foreground">
                  Example card content with responsive grid layout.
                </p>
              </div>
            ))}
          </div>

          {/* Loading State */}
          <div className="mt-8 flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span>Loading example...</span>
          </div>

          {/* Responsive Text */}
          <div className="mt-8">
            <p className="text-sm md:text-base lg:text-lg">
              This text is responsive: small on mobile, base on tablet, large on desktop.
            </p>
            {isMobile && (
              <p className="mt-2 text-xs text-muted-foreground">
                You&apos;re viewing on mobile
              </p>
            )}
          </div>
        </Container>
      </Section>
    </div>
  );
}

