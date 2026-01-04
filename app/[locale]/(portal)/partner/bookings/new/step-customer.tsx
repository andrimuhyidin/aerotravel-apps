/**
 * Step 2: Customer Details + Pax Count - MERGED & REDESIGNED
 * Ultra-compact design with smart customer search and enhanced pax counter
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, Plus, Minus, User, Phone, Mail, MessageSquare, Sparkles, ChevronDown, Baby, UserCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { CustomerSearchInput } from './components/customer-search-input';
import { type CustomerSearchResult } from '@/hooks/use-customer-search';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type StepCustomerProps = {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  adultPax?: number;
  childPax?: number;
  infantPax?: number;
  specialRequests?: string;
  onChange: (data: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    adultPax?: number;
    childPax?: number;
    infantPax?: number;
    specialRequests?: string;
  }) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepCustomer({
  customerName = '',
  customerPhone = '',
  customerEmail = '',
  adultPax = 1,
  childPax = 0,
  infantPax = 0,
  specialRequests = '',
  onChange,
  onNext,
  onBack,
}: StepCustomerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutoFillBanner, setShowAutoFillBanner] = useState(false);
  const [specialRequestsOpen, setSpecialRequestsOpen] = useState(false);

  const handleCustomerSelect = (customer: CustomerSearchResult) => {
    // Auto-fill customer data
    onChange({
      customerId: customer.customerId || undefined,
      customerName: customer.customerName || '',
      customerPhone: customer.customerPhone,
      customerEmail: customer.customerEmail || '',
      adultPax: customer.suggestedPax || adultPax,
    });

    // Show success banner
    setShowAutoFillBanner(true);
    setTimeout(() => setShowAutoFillBanner(false), 3000);

    toast.success('Data customer berhasil diisi otomatis!');
  };

  const handlePaxChange = (type: 'adult' | 'child' | 'infant', delta: number) => {
    const updates: any = {};

    if (type === 'adult') {
      const newValue = Math.max(1, (adultPax || 1) + delta);
      updates.adultPax = newValue;
    } else if (type === 'child') {
      const newValue = Math.max(0, (childPax || 0) + delta);
      updates.childPax = newValue;
    } else if (type === 'infant') {
      const newValue = Math.max(0, (infantPax || 0) + delta);
      updates.infantPax = newValue;
    }

    onChange(updates);
  };

  const totalPax = (adultPax || 0) + (childPax || 0) + (infantPax || 0);
  const canProceed = customerName.length >= 3 && customerPhone.length >= 10;

  return (
    <div className="space-y-3">
      {/* Auto-fill Success Banner */}
      {showAutoFillBanner && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-in slide-in-from-top">
          <Sparkles className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-xs font-medium text-green-800">
            Data customer berhasil diisi otomatis dari riwayat!
          </p>
        </div>
      )}

      {/* Customer Data Card - Ultra Compact */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              2
            </div>
            Data Pemesan
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-3">
          {/* Customer Search */}
          <div className="space-y-2">
            <Label htmlFor="customer-search" className="text-xs text-muted-foreground">
              Cari Customer (Opsional)
            </Label>
            <CustomerSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onCustomerSelect={handleCustomerSelect}
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Atau isi manual
              </span>
            </div>
          </div>

          {/* Manual Input Fields - Compact */}
          <div className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="customer-name" className="text-xs flex items-center gap-1">
                <User className="h-4 w-4" />
                Nama Lengkap <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => onChange({ customerName: e.target.value })}
                placeholder="Nama sesuai KTP/Paspor"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-phone" className="text-xs flex items-center gap-1">
                <Phone className="h-4 w-4" />
                No. WhatsApp <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customer-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => onChange({ customerPhone: e.target.value })}
                placeholder="08123456789"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-email" className="text-xs flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email (Opsional)
              </Label>
              <Input
                id="customer-email"
                type="email"
                value={customerEmail}
                onChange={(e) => onChange({ customerEmail: e.target.value })}
                placeholder="email@example.com"
                className="h-9 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pax Counter Card - Ultra Compact with Enhanced Buttons */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2 px-3 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-primary" />
              Jumlah Peserta
            </CardTitle>
            <Badge variant="default" className="text-[10px] h-5">
              {totalPax} Orang
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          {/* Adult - Clean Design */}
          <div className="flex items-center justify-between p-2 border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-semibold text-xs leading-tight">Dewasa</p>
                <p className="text-[10px] text-muted-foreground">Usia 12+ tahun</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 active:scale-95 transition-transform"
                onClick={() => handlePaxChange('adult', -1)}
                disabled={adultPax <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold text-base w-7 text-center">{adultPax}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 active:scale-95 transition-transform"
                onClick={() => handlePaxChange('adult', 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Child */}
          <div className="flex items-center justify-between p-2 border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-semibold text-xs leading-tight">Anak</p>
                <p className="text-[10px] text-muted-foreground">Usia 2-11 tahun</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 active:scale-95 transition-transform"
                onClick={() => handlePaxChange('child', -1)}
                disabled={childPax <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold text-base w-7 text-center">{childPax}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 active:scale-95 transition-transform"
                onClick={() => handlePaxChange('child', 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Infant */}
          <div className="flex items-center justify-between p-2 border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2">
              <Baby className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-semibold text-xs leading-tight">Bayi</p>
                <p className="text-[10px] text-muted-foreground">Usia 0-23 bulan</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 active:scale-95 transition-transform"
                onClick={() => handlePaxChange('infant', -1)}
                disabled={infantPax <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold text-base w-7 text-center">{infantPax}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 active:scale-95 transition-transform"
                onClick={() => handlePaxChange('infant', 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Special Requests Card - Collapsible */}
      <Card className="border-border/50 shadow-sm">
        <Collapsible open={specialRequestsOpen} onOpenChange={setSpecialRequestsOpen}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  Catatan Khusus (Opsional)
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform',
                    specialRequestsOpen && 'rotate-180'
                  )}
                />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="px-3 pb-3">
              <Textarea
                value={specialRequests}
                onChange={(e) => onChange({ specialRequests: e.target.value })}
                placeholder="Contoh: Alergi makanan, permintaan kamar khusus, dll."
                rows={3}
                className="resize-none text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Kami akan berusaha memenuhi permintaan khusus Anda
              </p>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Inline Navigation */}
      <div className="flex gap-3 pt-4 border-t">
        <Button 
          variant="outline"
          onClick={onBack}
          className="w-20 h-11 active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!canProceed}
          className="flex-1 h-11 active:scale-95 transition-transform"
        >
          Lanjutkan ke Review
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
