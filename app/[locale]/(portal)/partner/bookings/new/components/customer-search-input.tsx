/**
 * Customer Search Input Component
 * Smart search with auto-complete and suggestions
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Clock, Star, Loader2 } from 'lucide-react';
import { useCustomerSearch, type CustomerSearchResult } from '@/hooks/use-customer-search';
import { Badge } from '@/components/ui/badge';

type CustomerSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onCustomerSelect: (customer: CustomerSearchResult) => void;
};

export function CustomerSearchInput({
  value,
  onChange,
  onCustomerSelect,
}: CustomerSearchInputProps) {
  const { search, results, loading } = useCustomerSearch();
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search on input change
  useEffect(() => {
    if (value.length >= 3) {
      search(value);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [value, search]);

  const handleSelect = (customer: CustomerSearchResult) => {
    onCustomerSelect(customer);
    onChange(''); // Clear search
    setShowResults(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cari berdasarkan nama atau no. HP..."
          className="pl-10 pr-10 h-11"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && results && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-background border rounded-lg shadow-lg max-h-80 overflow-y-auto">
          <div className="p-2">
            <p className="text-xs text-muted-foreground px-2 py-1 mb-1">
              {results.length} customer ditemukan
            </p>
            <div className="space-y-1">
              {results.map((customer, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(customer)}
                  className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{customer.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.customerPhone}
                      </p>
                    </div>
                    <div className="text-right">
                      {customer.isRepeatingCustomer && (
                        <Badge variant="secondary" className="text-[10px] mb-1">
                          <Star className="h-4 w-4 mr-0.5 fill-yellow-500 text-yellow-500" />
                          Repeat
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {customer.bookingCount} booking
                      </p>
                    </div>
                  </div>
                  {customer.suggestedPax && (
                    <p className="text-xs text-primary mt-1">
                      Biasanya: {customer.suggestedPax} pax
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {showResults && results && results.length === 0 && !loading && (
        <div className="absolute z-50 mt-2 w-full bg-background border rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Tidak ada customer ditemukan
          </p>
        </div>
      )}
    </div>
  );
}
