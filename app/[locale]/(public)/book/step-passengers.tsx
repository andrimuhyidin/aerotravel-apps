/**
 * Step 3: Passengers Data for Public Booking
 */

'use client';

import { Baby, Mail, Minus, Phone, Plus, User, Users } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { type BookingFormData } from './booking-wizard-client';

type PackageData = {
  id: string;
  slug: string;
  name: string;
  destination: string;
  province: string;
  duration: { days: number; nights: number; label: string };
  thumbnailUrl?: string;
  pricing: {
    adultPrice: number;
    childPrice: number;
    infantPrice: number;
  };
  minPax: number;
  maxPax: number;
  inclusions: string[];
  exclusions: string[];
};

type StepPassengersPublicProps = {
  form: UseFormReturn<BookingFormData>;
  packageData: PackageData | null;
};

export function StepPassengersPublic({
  form,
  packageData,
}: StepPassengersPublicProps) {
  const values = form.watch();
  const totalPax = (values.adultPax || 0) + (values.childPax || 0) + (values.infantPax || 0);
  
  // Check min/max pax constraints
  const minPax = packageData?.minPax || 1;
  const maxPax = packageData?.maxPax || 20;
  const isValidPax = totalPax >= minPax && totalPax <= maxPax;

  const handlePaxChange = (type: 'adultPax' | 'childPax' | 'infantPax', delta: number) => {
    const currentValue = values[type] || 0;
    let newValue = currentValue + delta;
    
    // Apply constraints
    if (type === 'adultPax') {
      newValue = Math.max(1, newValue); // Min 1 adult
    } else {
      newValue = Math.max(0, newValue);
    }
    
    // Check max total
    const otherPax = totalPax - currentValue;
    if (otherPax + newValue > maxPax) {
      newValue = maxPax - otherPax;
    }
    
    form.setValue(type, newValue);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center py-2">
        <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <h2 className="font-bold text-lg">Data Pemesan</h2>
        <p className="text-sm text-muted-foreground">
          Isi data kontak dan jumlah peserta
        </p>
      </div>

      {/* Booker Information */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Data Kontak Pemesan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FormField
            control={form.control}
            name="bookerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Nama Lengkap <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Masukkan nama lengkap"
                    {...field}
                    className="h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bookerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="08xxxxxxxxxx"
                    type="tel"
                    {...field}
                    className="h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bookerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="email@contoh.com"
                    type="email"
                    {...field}
                    className="h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Pax Counter */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Jumlah Peserta
            </span>
            <Badge variant={isValidPax ? 'default' : 'destructive'}>
              {totalPax} orang
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Adult Counter */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Dewasa</p>
                <p className="text-xs text-muted-foreground">12 tahun ke atas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePaxChange('adultPax', -1)}
                disabled={(values.adultPax || 1) <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-bold">{values.adultPax || 1}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePaxChange('adultPax', 1)}
                disabled={totalPax >= maxPax}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Child Counter */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Anak</p>
                <p className="text-xs text-muted-foreground">2-11 tahun</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePaxChange('childPax', -1)}
                disabled={(values.childPax || 0) <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-bold">{values.childPax || 0}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePaxChange('childPax', 1)}
                disabled={totalPax >= maxPax}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Infant Counter */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                <Baby className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Bayi</p>
                <p className="text-xs text-muted-foreground">Di bawah 2 tahun</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePaxChange('infantPax', -1)}
                disabled={(values.infantPax || 0) <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-bold">{values.infantPax || 0}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePaxChange('infantPax', 1)}
                disabled={totalPax >= maxPax}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Pax Constraint Warning */}
          {!isValidPax && (
            <p className="text-xs text-red-500 text-center">
              Jumlah peserta harus antara {minPax} - {maxPax} orang
            </p>
          )}
        </CardContent>
      </Card>

      {/* Special Requests */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Permintaan Khusus (Opsional)</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="specialRequests"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Contoh: Vegetarian, alergi makanan laut, butuh kursi roda, dll."
                    rows={3}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Price Preview */}
      {packageData && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-4">
            <div className="space-y-2 text-sm">
              {(values.adultPax || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Dewasa x {values.adultPax}</span>
                  <span>Rp {((values.adultPax || 0) * packageData.pricing.adultPrice).toLocaleString('id-ID')}</span>
                </div>
              )}
              {(values.childPax || 0) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Anak x {values.childPax}</span>
                  <span>Rp {((values.childPax || 0) * packageData.pricing.childPrice).toLocaleString('id-ID')}</span>
                </div>
              )}
              {(values.infantPax || 0) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Bayi x {values.infantPax}</span>
                  <span>Rp {((values.infantPax || 0) * packageData.pricing.infantPrice).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">
                  Rp {(
                    (values.adultPax || 0) * packageData.pricing.adultPrice +
                    (values.childPax || 0) * packageData.pricing.childPrice +
                    (values.infantPax || 0) * packageData.pricing.infantPrice
                  ).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

