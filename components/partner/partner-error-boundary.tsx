/**
 * Partner Error Boundary
 * Error boundary khusus untuk Partner Portal
 */

'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { logger } from '@/lib/utils/logger';

interface PartnerErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface PartnerErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class PartnerErrorBoundary extends React.Component<
  PartnerErrorBoundaryProps,
  PartnerErrorBoundaryState
> {
  constructor(props: PartnerErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): PartnerErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('PartnerErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      boundary: 'PartnerErrorBoundary',
    });

    // Log to Sentry if available
    if (typeof window !== 'undefined') {
      const windowWithSentry = window as unknown as {
        Sentry?: {
          captureException: (error: Error, context: unknown) => void;
        };
      };
      if (windowWithSentry.Sentry) {
        windowWithSentry.Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
          tags: {
            errorBoundary: 'PartnerErrorBoundary',
            portal: 'partner',
          },
        });
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <ErrorState
              icon={AlertTriangle}
              title="Terjadi Kesalahan"
              message={
                this.state.error?.message ||
                'Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba lagi atau hubungi support jika masalah berlanjut.'
              }
              onRetry={() => {
                this.resetError();
                setTimeout(() => {
                  if (this.state.hasError) {
                    window.location.reload();
                  }
                }, 100);
              }}
              variant="default"
              showDetails={process.env.NODE_ENV === 'development'}
              details={this.state.error?.stack}
              actions={[
                {
                  label: 'Kembali ke Dashboard',
                  onClick: () => {
                    window.location.href = '/partner/dashboard';
                  },
                  variant: 'outline' as const,
                },
              ]}
            />
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

