/**
 * Partner Booking Wizard Client Component
 * Multi-step booking form for partners with NTA pricing
 * REDESIGNED - Sticky Summary, Smart Forms, Mobile Bottom Sheet
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CreditCard,
  Loader2,
  MapPin,
  Plus,
  TrendingUp,
  Trash2,
  Users,
  Wallet,
  ChevronUp,
  ChevronDown,
  Info,
  Package as PackageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import queryKeys from '@/lib/queries/query-keys';
import { usePartnerAuth } from '@/hooks/use-partner-auth';
import { logger } from '@/lib/utils/logger';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  calculateMargin,
  calculateNTATotal,
  calculatePublishTotal,
  formatCurrency,
  type PackageSummary,
} from '@/lib/partner/package-utils';
import { getWalletBalance, type WalletBalance } from '@/lib/partner/wallet';
import { cn } from '@/lib/utils';
import { CameraInput } from '@/components/partner/mobile/camera-input';
import { LocationPicker } from '@/components/partner/mobile/location-picker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const STEPS = [
  { id: 1, label: 'Paket & Tanggal', icon: Calendar },
  { id: 2, label: 'Customer', icon: Users },
  { id: 3, label: 'Peserta', icon: Users },
  { id: 4, label: 'Pembayaran', icon: CreditCard },
  { id: 5, label: 'Konfirmasi', icon: Check },
];

const passengerSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal 2 karakter'),
  dateOfBirth: z.date().optional().nullable(),
  dietaryRequirements: z.string().optional(),
  healthConditions: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  roomAssignment: z.string().optional(),
});

const bookingWizardSchema = z.object({
  packageId: z.string().min(1, 'Pilih paket terlebih dahulu'),
  tripDate: z.date({ message: 'Pilih tanggal trip' }),
  customerId: z.string().optional(),
  customerName: z.string().min(3, 'Nama customer minimal 3 karakter'),
  customerPhone: z.string().min(10, 'Nomor telepon tidak valid'),
  customerEmail: z.string().email('Email tidak valid').optional().or(z.literal('')),
  customerSegment: z.enum(['individual', 'family', 'corporate', 'honeymoon', 'school']).optional(),
  adultPax: z.number().min(1, 'Minimal 1 orang dewasa'),
  childPax: z.number().min(0).default(0).optional(),
  infantPax: z.number().min(0).default(0).optional(),
  roomPreference: z.string().optional(),
  multiRoom: z.number().min(0).default(0).optional(),
  multiKapal: z.number().min(0).default(0).optional(),
  passengers: z.array(passengerSchema).optional(),
  paymentMethod: z.enum(['wallet', 'external'], {
    message: 'Pilih metode pembayaran',
  }),
  specialRequests: z.string().optional(),
});

type BookingWizardFormData = z.infer<typeof bookingWizardSchema>;

type BookingWizardClientProps = {
  locale: string;
  initialPackageId?: string;
};

// Customer Selector Component (Simplified for brevity)
function CustomerSelector({ value, onChange }: { value?: string, onChange: (id?: string, data?: any) => void }) {
  // Mock implementation for UI focus
  return (
    <div className="relative">
      <Input 
        placeholder="Cari customer (Ketik nama...)" 
        className="pl-10" 
        onChange={(e) => {
          // In real app, this searches API. For UI demo:
          if(e.target.value.length > 2) onChange('cust-123', { name: 'Budi Santoso', phone: '08123456789' });
        }}
      />
      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  );
}

export function BookingWizardClient({
  locale,
  initialPackageId,
}: BookingWizardClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { partnerId } = usePartnerAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Data states
  const [packageData, setPackageData] = useState<PackageSummary | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [availability, setAvailability] = useState<{
    availableDates: string[];
    maxCapacity: number;
  } | null>(null);

  const form = useForm<BookingWizardFormData>({
    resolver: zodResolver(bookingWizardSchema),
    defaultValues: {
      packageId: initialPackageId || '',
      adultPax: 1,
      childPax: 0,
      infantPax: 0,
      paymentMethod: 'wallet',
      specialRequests: '',
      passengers: [],
    },
  });

  // Watch form values for summary calculation
  const values = form.watch();
  
  // Load initial data
  useEffect(() => {
    if (values.packageId) {
      loadPackageData(values.packageId);
      loadAvailability(values.packageId);
    }
  }, [values.packageId]);

  useEffect(() => {
    loadWalletBalance();
  }, []);

  const loadPackageData = async (id: string) => {
    try {
      setLoading(true);
      // Mock fetch for UI dev - replace with actual API
      const res = await fetch(`/api/partner/packages?limit=1000`);
      const data = await res.json();
      const pkg = data.packages?.find((p: PackageSummary) => p.id === id);
      if (pkg) setPackageData(pkg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const res = await fetch('/api/partner/wallet/balance');
      const data = await res.json();
      setWalletBalance(data);
    } catch (e) { console.error(e); }
  };

  const loadAvailability = async (id: string) => {
    // Simplified for UI focus
    setAvailability({ availableDates: [], maxCapacity: 20 });
  };

  // Calculations
  const ntaTotal = packageData && packageData.pricingTiers.length > 0
    ? calculateNTATotal(values.adultPax || 1, values.childPax || 0, values.infantPax || 0, packageData.pricingTiers)
    : 0;
  
  const margin = packageData && packageData.pricingTiers.length > 0
    ? calculateMargin(values.adultPax || 1, values.childPax || 0, values.infantPax || 0, packageData.pricingTiers)
    : 0;

  const handleNext = async () => {
    // Simplified validation for UI demo
    let fields: any[] = [];
    if (currentStep === 1) fields = ['packageId', 'tripDate'];
    if (currentStep === 2) fields = ['customerName', 'customerPhone'];
    if (currentStep === 3) fields = ['adultPax'];
    
    const valid = await form.trigger(fields);
    if (valid && currentStep < 5) setCurrentStep(s => s + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  const handleSubmit = async (data: BookingWizardFormData) => {
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Booking berhasil dibuat!');
      router.push(`/${locale}/partner/bookings`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Page Header */}
      <div className="bg-background border-b">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link href={`/${locale}/partner/packages`} className="p-1.5 -ml-1.5 hover:bg-muted rounded-full shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold truncate">Buat Booking</h1>
              <p className="text-xs text-muted-foreground">Step {currentStep} of 5</p>
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1 w-full bg-muted overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-in-out" 
            style={{ width: `${(currentStep / 5) * 100}%` }} 
          />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                
                {/* Step 1: Package & Date */}
                {currentStep === 1 && (
                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</div>
                        Pilih Paket & Tanggal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Package Selection - Visual Enhancement */}
                      {values.packageId && packageData ? (
                        <div className="flex gap-4 p-4 border rounded-xl bg-muted/30">
                          <div className="h-20 w-20 bg-muted rounded-lg shrink-0 overflow-hidden relative">
                             {/* Image Placeholder */}
                             <PackageIcon className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-bold">{packageData.name}</h3>
                            <p className="text-sm text-muted-foreground">{packageData.destination}</p>
                            <Button variant="link" className="p-0 h-auto text-xs mt-1" onClick={() => form.setValue('packageId', '')}>
                              Ubah Paket
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Link href={`/${locale}/partner/packages`}>
                          <div className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-muted/50 cursor-pointer transition-colors">
                            <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="font-medium">Pilih Paket Wisata</p>
                            <p className="text-sm text-muted-foreground">Cari dari katalog paket kami</p>
                          </div>
                        </Link>
                      )}

                      <FormField
                        control={form.control}
                        name="tripDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Tanggal Keberangkatan</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      'w-full pl-3 text-left font-normal h-12',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP', { locale: id })
                                    ) : (
                                      <span>Pilih tanggal perjalanan</span>
                                    )}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Customer Data */}
                {currentStep === 2 && (
                  <Card className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">2</div>
                        Data Pemesan (Customer)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cari Database Customer (Opsional)</FormLabel>
                            <FormControl>
                              <CustomerSelector value={field.value} onChange={(id, data) => {
                                field.onChange(id);
                                if(data) {
                                  form.setValue('customerName', data.name);
                                  form.setValue('customerPhone', data.phone);
                                }
                              }} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="customerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nama Lengkap</FormLabel>
                              <FormControl>
                                <Input placeholder="Sesuai KTP/Paspor" {...field} className="h-11" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="customerPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>No. WhatsApp</FormLabel>
                              <FormControl>
                                <Input placeholder="08..." type="tel" {...field} className="h-11" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Opsional)</FormLabel>
                            <FormControl>
                              <Input placeholder="email@example.com" type="email" {...field} className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Pax & Details */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <Card className="border-none shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">3</div>
                          Jumlah Peserta
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <FormLabel>Dewasa</FormLabel>
                            <Input type="number" min="1" {...form.register('adultPax', { valueAsNumber: true })} className="h-11 text-center font-bold" />
                          </div>
                          <div className="space-y-2">
                            <FormLabel>Anak</FormLabel>
                            <Input type="number" min="0" {...form.register('childPax', { valueAsNumber: true })} className="h-11 text-center font-bold" />
                          </div>
                          <div className="space-y-2">
                            <FormLabel>Bayi</FormLabel>
                            <Input type="number" min="0" {...form.register('infantPax', { valueAsNumber: true })} className="h-11 text-center font-bold" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md">
                      <CardHeader>
                        <CardTitle>Dokumen & Request (Mobile)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <CameraInput 
                          label="Foto KTP/Dokumen"
                          onChange={(f) => console.log(f)}
                        />
                        <FormField
                          control={form.control}
                          name="specialRequests"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Catatan Khusus</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Alergi, request kamar, dll" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 1}>
                    Kembali
                  </Button>
                  <Button type="button" onClick={handleNext} disabled={!values.packageId}>
                    Lanjutkan
                  </Button>
                </div>
              </form>
            </Form>
          
          {/* Summary Card (Below Form on Mobile) */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5 border-b pb-4">
              <CardTitle className="text-base flex justify-between items-center">
                <span>Ringkasan Booking</span>
                {packageData && <Badge variant="outline" className="font-normal">Draft</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                  {packageData ? (
                    <>
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">{packageData.name}</p>
                        <p className="text-xs text-muted-foreground">{values.tripDate ? format(values.tripDate, 'PPP', { locale: id }) : 'Tanggal belum dipilih'}</p>
                      </div>
                      
                      <div className="space-y-2 pt-2 border-t text-sm">
                        <div className="flex justify-between">
                          <span>{values.adultPax}x Dewasa</span>
                          <span>-</span>
                        </div>
                        {(values.childPax ?? 0) > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>{values.childPax}x Anak</span>
                            <span>-</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-sm font-medium text-muted-foreground">Total NTA</span>
                          <span className="text-2xl font-bold text-primary">{formatCurrency(ntaTotal)}</span>
                        </div>
                        {margin > 0 && (
                          <div className="flex justify-between text-xs text-green-600 bg-green-50 p-2 rounded-md">
                            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Potensi Komisi</span>
                            <span className="font-bold">{formatCurrency(margin)}</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Pilih paket untuk melihat ringkasan
                    </div>
                  )}
                </CardContent>
              </Card>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-3">
          <Collapsible open={mobileSummaryOpen} onOpenChange={setMobileSummaryOpen}>
            <div className="flex items-center justify-between mb-3">
              <CollapsibleTrigger asChild>
                <div className="flex flex-col cursor-pointer">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    Total Estimasi {mobileSummaryOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                  </span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(ntaTotal)}</span>
                </div>
              </CollapsibleTrigger>
              <div className="flex gap-2 w-1/2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handlePrev} 
                  disabled={currentStep === 1}
                >
                  Back
                </Button>
                <Button 
                  type="button" 
                  className="flex-1" 
                  onClick={handleNext}
                  disabled={!values.packageId}
                >
                  Next
                </Button>
              </div>
            </div>
            <CollapsibleContent className="space-y-2 border-t pt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paket</span>
                <span className="font-medium text-right truncate w-40">{packageData?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peserta</span>
                <span>{values.adultPax + (values.childPax||0)} Pax</span>
              </div>
              {margin > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Komisi Anda</span>
                  <span>{formatCurrency(margin)}</span>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
