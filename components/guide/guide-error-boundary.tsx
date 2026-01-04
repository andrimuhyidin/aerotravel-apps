'use client';

/**
 * Error Boundary untuk Guide App
 * Catch errors di Guide components dan display user-friendly error message
 */

import { AlertTriangle } from 'lucide-react';
import { Component, type ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { logger } from '@/lib/utils/logger';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class GuideErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // Log error using structured logger
    logger.error('Guide Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      boundary: 'GuideErrorBoundary',
    });

    // Also log to Sentry if available
    if (typeof window !== 'undefined') {
      const windowWithSentry = window as unknown as { Sentry?: { captureException: (error: Error, context: unknown) => void } };
      if (windowWithSentry.Sentry) {
        windowWithSentry.Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
          tags: {
            errorBoundary: 'GuideErrorBoundary',
          },
        });
      }
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <ErrorState
              icon={AlertTriangle}
              title="Terjadi Kesalahan"
              message={
                this.state.error?.message ||
                'Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba lagi.'
              }
              onRetry={() => {
                this.resetError();
                // Try to reload if reset doesn't work
                setTimeout(() => {
                  if (this.state.hasError) {
                    window.location.reload();
                  }
                }, 100);
              }}
              variant="default"
              showDetails={process.env.NODE_ENV === 'development'}
              details={this.state.error?.stack}
            />
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

