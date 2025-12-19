'use client';

/**
 * AI-Enhanced Expenses Component
 * Integrates receipt OCR + auto-categorize + duplicate detection
 */

import { useMutation } from '@tanstack/react-query';
import { AlertCircle, Camera, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ExpensesAiEnhancedProps = {
  tripId: string;
  onExpenseAdded?: (expense: {
    amount: number;
    category: string;
    description: string;
    merchant: string;
  }) => void;
};

export function ExpensesAiEnhanced({ tripId, onExpenseAdded }: ExpensesAiEnhancedProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    receipt?: {
      amount: number;
      date: string;
      merchant: string;
      category: string;
    };
    duplicate?: {
      isDuplicate: boolean;
      confidence: number;
    };
  } | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const analyzeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tripId', tripId);

      const res = await fetch('/api/guide/expenses/analyze-receipt', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to analyze receipt');
      return (await res.json()) as {
        receipt: {
          amount: number;
          date: string;
          merchant: string;
          category: string;
        };
        duplicate: {
          isDuplicate: boolean;
          confidence: number;
        };
      };
    },
    onSuccess: (data) => {
      setResult(data);
      setShowDialog(true);
      if (data.receipt && onExpenseAdded) {
        onExpenseAdded({
          amount: data.receipt.amount,
          category: data.receipt.category,
          description: data.receipt.merchant,
          merchant: data.receipt.merchant,
        });
      }
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnalyzing(true);
      analyzeMutation.mutate(file);
    }
  };

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">AI Receipt Scanner</p>
              <p className="text-xs text-slate-500">
                Foto struk untuk auto-extract & categorize
              </p>
            </div>
            <label htmlFor="receipt-upload-ai" className="cursor-pointer">
              <div className="flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100">
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    <span>Scan</span>
                  </>
                )}
              </div>
              <input
                id="receipt-upload-ai"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={analyzing}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receipt Analysis Result</DialogTitle>
            <DialogDescription>
              AI telah menganalisis struk Anda
            </DialogDescription>
          </DialogHeader>
          {result && (
            <div className="space-y-4">
              {result.duplicate?.isDuplicate && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        Duplicate Detected
                      </p>
                      <p className="text-xs text-amber-700">
                        Struk ini mirip dengan expense yang sudah ada (confidence: {Math.round(result.duplicate.confidence * 100)}%)
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {result.receipt && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Amount:</span>
                    <span className="font-semibold">
                      Rp {result.receipt.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Merchant:</span>
                    <span className="font-medium">{result.receipt.merchant}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Category:</span>
                    <span className="font-medium capitalize">{result.receipt.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Date:</span>
                    <span className="text-sm">{result.receipt.date}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
            {result?.receipt && !result.duplicate?.isDuplicate && (
              <Button
                onClick={() => {
                  setShowDialog(false);
                  // Expense will be added via onExpenseAdded callback
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Use This Data
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
