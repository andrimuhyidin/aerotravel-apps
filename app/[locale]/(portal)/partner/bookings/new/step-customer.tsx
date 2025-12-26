/**
 * Step 2: Customer Details + Pax Count
 * 
 * Features:
 * - Smart customer search
 * - Auto-fill from history
 * - Pax selector (+/- buttons)
 * - Special requests
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Minus, User, Phone, Mail, MessageSquare, Sparkles } from 'lucide-react';
import { CustomerSearchInput } from './components/customer-search-input';
import { type CustomerSearchResult } from '@/hooks/use-customer-search';
import { toast } from 'sonner';

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
  adultPax = 2,
  childPax = 0,
  infantPax = 0,
  specialRequests = '',
  onChange,
  onNext,
  onBack,
}: StepCustomerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutoFillBanner, setShowAutoFillBanner] = useState(false);

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

  const canProceed = customerName.length >= 3 && customerPhone.length >= 10;

  return (
    <div className="space-y-4">
      {/* Auto-fill Success Banner */}
      {showAutoFillBanner && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-in slide-in-from-top">
          <Sparkles className="h-5 w-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">
            Data customer berhasil diisi otomatis dari riwayat booking!
          </p>
        </div>
      )}

      {/* Customer Data Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              2
            </div>
            Data Pemesan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Search */}
          <div className="space-y-2">
            <Label htmlFor="customer-search">
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
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Atau isi manual
              </span>
            </div>
          </div>

          {/* Manual Input Fields */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="customer-name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nama Lengkap <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => onChange({ customerName: e.target.value })}
                placeholder="Nama sesuai KTP/Paspor"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                No. WhatsApp <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customer-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => onChange({ customerPhone: e.target.value })}
                placeholder="08123456789"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email (Opsional)
              </Label>
              <Input
                id="customer-email"
                type="email"
                value={customerEmail}
                onChange={(e) => onChange({ customerEmail: e.target.value })}
                placeholder="email@example.com"
                className="h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pax Counter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Jumlah Peserta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Adult */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-semibold">Dewasa</p>
              <p className="text-xs text-muted-foreground">Usia 12 tahun ke atas</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => handlePaxChange('adult', -1)}
                disabled={adultPax <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold text-lg w-8 text-center">{adultPax}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => handlePaxChange('adult', 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Child */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-semibold">Anak</p>
              <p className="text-xs text-muted-foreground">Usia 2-11 tahun</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => handlePaxChange('child', -1)}
                disabled={childPax <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold text-lg w-8 text-center">{childPax}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => handlePaxChange('child', 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Infant */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-semibold">Bayi</p>
              <p className="text-xs text-muted-foreground">Usia 0-23 bulan</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => handlePaxChange('infant', -1)}
                disabled={infantPax <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold text-lg w-8 text-center">{infantPax}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => handlePaxChange('infant', 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Total Summary */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Peserta</span>
              <Badge variant="default" className="text-base">
                {(adultPax || 0) + (childPax || 0) + (infantPax || 0)} Orang
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Special Requests Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Catatan Khusus (Opsional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={specialRequests}
            onChange={(e) => onChange({ specialRequests: e.target.value })}
            placeholder="Contoh: Alergi makanan, permintaan kamar khusus, dll."
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Kami akan berusaha memenuhi permintaan khusus Anda sebaik mungkin
          </p>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1 h-12">
          Kembali
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1 h-12">
          Lanjutkan ke Review
        </Button>
      </div>
    </div>
  );
}

