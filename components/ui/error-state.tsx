/**
 * Error State Component
 * Standardized error state UI with retry functionality
 */

import { cn } from '@/lib/utils';
import { AlertCircle, type LucideIcon, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';

export type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
  className?: string;
  variant?: 'default' | 'card' | 'inline';
  showIcon?: boolean;
  icon?: LucideIcon;
  showDetails?: boolean;
  details?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'link' | 'secondary';
  }>;
};

export function ErrorState({
  title = 'Terjadi Kesalahan',
  message,
  onRetry,
  retryLabel = 'Coba Lagi',
  className,
  variant = 'default',
  showIcon = true,
  icon: Icon = AlertCircle,
  showDetails = false,
  details,
  actions,
}: ErrorStateProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3', className)}>
        {showIcon && (
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" aria-hidden="true" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-700">{title}</p>
          <p className="mt-0.5 text-xs text-red-600">{message}</p>
        </div>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            disabled={isRetrying}
            className="h-8 border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className={cn('h-3 w-3', isRetrying && 'animate-spin')} />
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn('border-red-200 bg-red-50', className)}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          {showIcon && (
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Icon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
          )}
          <h3 className="mb-2 text-sm font-semibold text-red-900">{title}</h3>
          <p className="mb-4 text-xs text-red-700 max-w-sm">{message}</p>
          {showDetails && details && (
            <div className="mb-4 w-full max-w-md rounded-md bg-red-100 p-3 text-left">
              <p className="mb-1 text-xs font-semibold text-red-900">Details:</p>
              <pre className="text-xs text-red-800 whitespace-pre-wrap break-words">{details}</pre>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                disabled={isRetrying}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', isRetrying && 'animate-spin')} />
                {retryLabel}
              </Button>
            )}
            {actions?.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.variant || 'outline'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
      {showIcon && (
        <Icon className="mb-3 h-12 w-12 text-red-400" aria-hidden="true" />
      )}
      <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mb-4 text-xs text-slate-600 max-w-sm">{message}</p>
      {showDetails && details && (
        <div className="mb-4 w-full max-w-md rounded-md bg-red-50 p-3 text-left">
          <p className="mb-1 text-xs font-semibold text-red-900">Details:</p>
          <pre className="text-xs text-red-800 whitespace-pre-wrap break-words">{details}</pre>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isRetrying && 'animate-spin')} />
            {retryLabel}
          </Button>
        )}
        {actions?.map((action, index) => (
          <Button
            key={index}
            size="sm"
            variant={action.variant || 'outline'}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
