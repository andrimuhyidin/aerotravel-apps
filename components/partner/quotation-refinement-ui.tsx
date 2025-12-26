/**
 * Quotation Refinement UI Component
 * UI untuk iterative quotation refinement
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Send, ArrowLeft, CheckCircle2, XCircle2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import type { DraftQuotation } from '@/lib/ai/quotation-copilot';

type QuotationRefinementUIProps = {
  originalQuotation: DraftQuotation;
  onRefined: (refinedQuotation: DraftQuotation) => void;
  onCancel: () => void;
};

const QUICK_ACTIONS = [
  { label: 'Make it cheaper', prompt: 'make it cheaper' },
  { label: 'Add snorkeling', prompt: 'add snorkeling activity' },
  { label: 'Add more activities', prompt: 'add more activities to itinerary' },
  { label: 'Remove day 2', prompt: 'remove activities from day 2' },
  { label: 'Adjust pricing', prompt: 'adjust pricing to be more competitive' },
];

export function QuotationRefinementUI({
  originalQuotation,
  onRefined,
  onCancel,
}: QuotationRefinementUIProps) {
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [refinementHistory, setRefinementHistory] = useState<Array<{
    prompt: string;
    changes: string[];
    timestamp: Date;
  }>>(originalQuotation.refinementHistory || []);
  const [currentQuotation, setCurrentQuotation] = useState<DraftQuotation>(originalQuotation);

  const handleRefine = async (prompt?: string) => {
    const promptToUse = prompt || refinementPrompt.trim();
    if (!promptToUse || loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/partner/ai/quotation/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuotation: currentQuotation,
          refinementPrompt: promptToUse,
          conversationHistory: refinementHistory.map((h) => ({
            type: 'refinement' as const,
            content: h.prompt,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refine quotation');
      }

      const data = await response.json();
      const refined = data.quotation as DraftQuotation;

      setCurrentQuotation(refined);
      setRefinementHistory(refined.refinementHistory || []);
      setRefinementPrompt('');

      toast.success('Quotation berhasil direfinement');
    } catch (error) {
      logger.error('Failed to refine quotation', error);
      toast.error('Gagal melakukan refinement. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onRefined(currentQuotation);
  };

  const handleQuickAction = (prompt: string) => {
    setRefinementPrompt(prompt);
    handleRefine(prompt);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Refine Quotation
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Original Quotation Summary */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">Original Quotation</h3>
            {originalQuotation.selectedPackage && (
              <div className="text-sm space-y-1">
                <p>
                  <strong>Package:</strong> {originalQuotation.selectedPackage.packageName}
                </p>
                <p>
                  <strong>Total:</strong> Rp{' '}
                  {originalQuotation.pricingBreakdown.total.toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Quick Actions:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={loading}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Refinement Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              What would you like to change?
            </label>
            <div className="flex gap-2">
              <Input
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                placeholder="e.g., make it cheaper, add snorkeling..."
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleRefine();
                  }
                }}
              />
              <Button onClick={() => handleRefine()} disabled={loading || !refinementPrompt.trim()}>
                {loading ? (
                  <Skeleton className="h-4 w-4 rounded-full" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Refinement History */}
          {refinementHistory.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Refinement History:</p>
              <ScrollArea className="h-32 w-full border rounded p-2">
                <div className="space-y-2">
                  {refinementHistory.map((refinement, idx) => (
                    <div key={idx} className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span className="font-medium">{refinement.prompt}</span>
                      </div>
                      {refinement.changes.length > 0 && (
                        <div className="ml-5 space-y-1">
                          {refinement.changes.map((change, changeIdx) => (
                            <div key={changeIdx} className="text-muted-foreground">
                              • {change}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Current Quotation Preview */}
          {currentQuotation !== originalQuotation && (
            <div className="border rounded-lg p-4 bg-primary/5">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Refined Quotation
              </h3>
              {currentQuotation.selectedPackage && (
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Package:</strong> {currentQuotation.selectedPackage.packageName}
                  </p>
                  <p>
                    <strong>Total:</strong> Rp{' '}
                    {currentQuotation.pricingBreakdown.total.toLocaleString('id-ID')}
                  </p>
                  {currentQuotation.refinementExplanation && (
                    <p className="text-muted-foreground mt-2">
                      {currentQuotation.refinementExplanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={currentQuotation === originalQuotation}
            >
              Apply Refinement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

