/**
 * Pricing Summary Sticky Component
 * Sticky bottom bar showing pricing and quick actions
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, TrendingUp, Wallet, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/partner/package-utils';
import { cn } from '@/lib/utils';

type PricingSummaryStickyProps = {
  ntaTotal: number;
  commission: number;
  totalAmount: number;
  paymentMethod: 'wallet' | 'external';
  onPaymentMethodChange?: (method: 'wallet' | 'external') => void;
  showBreakdown?: boolean;
};

export function PricingSummarySticky({
  ntaTotal,
  commission,
  totalAmount,
  paymentMethod,
  onPaymentMethodChange,
  showBreakdown = false,
}: PricingSummaryStickyProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 bg-background border-t shadow-lg max-w-md mx-auto">
      {/* Expandable Section */}
      {expanded && showBreakdown && (
        <div className="p-4 border-b space-y-3 animate-in slide-in-from-bottom">
          {/* Price Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Harga NTA</span>
              <span className="font-semibold">{formatCurrency(ntaTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Harga Publish</span>
              <span className="font-semibold">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Commission Highlight */}
          {commission > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">Komisi Anda</span>
                </div>
                <span className="font-bold text-green-600">{formatCurrency(commission)}</span>
              </div>
            </div>
          )}

          {/* Payment Method Toggle */}
          {onPaymentMethodChange && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={paymentMethod === 'wallet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPaymentMethodChange('wallet')}
                className="h-10"
              >
                <Wallet className="h-4 w-4 mr-2" />
                <span className="text-xs">Wallet</span>
                {paymentMethod === 'wallet' && (
                  <Badge variant="secondary" className="ml-2 bg-green-600 text-white text-[10px]">
                    INSTANT
                  </Badge>
                )}
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'external' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPaymentMethodChange('external')}
                className="h-10"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                <span className="text-xs">Bayar Nanti</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Main Pricing Bar */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Total Pembayaran</p>
            <p className="font-bold text-xl text-primary">{formatCurrency(ntaTotal)}</p>
            {commission > 0 && (
              <p className="text-xs text-green-600 font-medium">
                Komisi: {formatCurrency(commission)}
              </p>
            )}
          </div>

          {showBreakdown && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className="ml-2 shrink-0"
            >
              {expanded ? (
                <ChevronDown className="h-6 w-6" />
              ) : (
                <ChevronUp className="h-6 w-6" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
