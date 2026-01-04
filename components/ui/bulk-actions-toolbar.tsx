'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X, Loader2, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type BulkAction = {
  id: string;
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  requiresConfirmation?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  loadingLabel?: string;
};

export type BulkActionsToolbarProps = {
  selectedCount: number;
  totalCount: number;
  actions: BulkAction[];
  onAction: (actionId: string) => Promise<void> | void;
  onClear: () => void;
  className?: string;
  isProcessing?: boolean;
  progress?: number; // 0-100
  itemLabel?: string; // e.g., "booking", "user"
};

/**
 * Bulk Actions Toolbar Component
 * 
 * A floating toolbar that appears when items are selected in a list view.
 * Provides bulk action buttons with optional confirmation dialogs.
 * 
 * @example
 * ```tsx
 * <BulkActionsToolbar
 *   selectedCount={selectedIds.size}
 *   totalCount={data.length}
 *   actions={[
 *     { id: 'delete', label: 'Delete', icon: Trash, variant: 'destructive', requiresConfirmation: true },
 *     { id: 'export', label: 'Export', icon: Download },
 *   ]}
 *   onAction={handleBulkAction}
 *   onClear={clearSelection}
 * />
 * ```
 */
export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  actions,
  onAction,
  onClear,
  className,
  isProcessing = false,
  progress,
  itemLabel = 'item',
}: BulkActionsToolbarProps) {
  const [confirmingAction, setConfirmingAction] = useState<BulkAction | null>(null);
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);

  if (selectedCount === 0) {
    return null;
  }

  const handleActionClick = async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setConfirmingAction(action);
      return;
    }
    await executeAction(action);
  };

  const executeAction = async (action: BulkAction) => {
    setProcessingActionId(action.id);
    try {
      await onAction(action.id);
    } finally {
      setProcessingActionId(null);
      setConfirmingAction(null);
    }
  };

  const handleConfirm = async () => {
    if (confirmingAction) {
      await executeAction(confirmingAction);
    }
  };

  const plural = selectedCount > 1 ? 's' : '';
  const selectionText = `${selectedCount} ${itemLabel}${plural} dipilih`;

  return (
    <>
      {/* Floating Toolbar */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 z-50 -translate-x-1/2",
          "flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg",
          "animate-in slide-in-from-bottom-4 duration-200",
          className
        )}
      >
        {/* Selection Info */}
        <div className="flex items-center gap-2 border-r pr-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {selectedCount}
          </div>
          <span className="text-sm font-medium">{selectionText}</span>
        </div>

        {/* Progress Bar (if processing) */}
        {isProcessing && progress !== undefined && (
          <div className="flex items-center gap-2 border-r pr-3">
            <Progress value={progress} className="h-2 w-24" />
            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            const isLoading = processingActionId === action.id || (isProcessing && processingActionId === action.id);
            
            return (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => handleActionClick(action)}
                disabled={isProcessing}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : Icon ? (
                  <Icon className="mr-2 h-4 w-4" />
                ) : null}
                {isLoading && action.loadingLabel ? action.loadingLabel : action.label}
              </Button>
            );
          })}
        </div>

        {/* Clear Selection Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          disabled={isProcessing}
          className="ml-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmingAction}
        onOpenChange={(open) => !open && setConfirmingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmingAction?.confirmTitle || `${confirmingAction?.label} ${selectedCount} ${itemLabel}${plural}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmingAction?.confirmDescription || 
                `Aksi ini akan diterapkan ke ${selectedCount} ${itemLabel}${plural} yang dipilih. Pastikan Anda sudah memilih dengan benar.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={isProcessing}
              className={cn(
                confirmingAction?.variant === 'destructive' && 
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {confirmingAction?.loadingLabel || 'Processing...'}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Ya, Lanjutkan
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

