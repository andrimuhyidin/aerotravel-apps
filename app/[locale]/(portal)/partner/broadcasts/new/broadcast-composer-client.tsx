/**
 * Broadcast Composer Client Component
 * Create and send WhatsApp broadcast campaigns
 */

'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  MessageSquare,
  Send,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PageHeader } from '@/components/partner';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

const broadcastSchema = z.object({
  name: z.string().min(3, 'Nama broadcast minimal 3 karakter'),
  templateName: z.string().min(1, 'Pilih template'),
  audienceType: z.enum(['all', 'segment', 'custom']),
  segment: z.string().optional(),
  scheduledAt: z.date().optional().nullable(),
  sendNow: z.boolean(),
});

type BroadcastFormData = z.infer<typeof broadcastSchema>;

type WATemplate = {
  name: string;
  language: string;
  status: string;
  category: string;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  segment: string | null;
  lastBookingDate: string | null;
};

type BroadcastComposerClientProps = {
  locale: string;
};

export function BroadcastComposerClient({ locale }: BroadcastComposerClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const form = useForm<BroadcastFormData>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      name: '',
      templateName: '',
      audienceType: 'all',
      segment: undefined,
      scheduledAt: null,
      sendNow: true,
    },
  });

  // Fetch WA templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: queryKeys.partner.broadcasts.templates(),
    queryFn: async () => {
      const response = await apiClient.get<{ templates: WATemplate[] }>(
        '/api/partner/broadcasts/templates'
      );
      return response.data.templates;
    },
  });

  // Fetch customers
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: queryKeys.partner.customers.list(),
    queryFn: async () => {
      const response = await apiClient.get<{ customers: Customer[] }>(
        '/api/partner/customers?limit=500'
      );
      return response.data.customers;
    },
    enabled: step >= 2,
  });

  // Filtered customers based on audience type
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    const audienceType = form.watch('audienceType');
    const segment = form.watch('segment');

    if (audienceType === 'all') return customers;
    if (audienceType === 'segment' && segment) {
      return customers.filter((c: Customer) => c.segment === segment);
    }
    if (audienceType === 'custom') {
      return customers.filter((c: Customer) => selectedCustomers.includes(c.id));
    }
    return customers;
  }, [customers, form.watch('audienceType'), form.watch('segment'), selectedCustomers]);

  // Create broadcast mutation
  const createMutation = useMutation({
    mutationFn: async (data: BroadcastFormData) => {
      return apiClient.post('/api/partner/broadcasts', {
        ...data,
        recipientIds:
          data.audienceType === 'custom' ? selectedCustomers : undefined,
        recipientCount: filteredCustomers.length,
      });
    },
    onSuccess: () => {
      toast.success('Broadcast berhasil dibuat!');
      router.push(`/${locale}/partner/broadcasts`);
    },
    onError: () => {
      toast.error('Gagal membuat broadcast');
    },
  });

  // Unique segments
  const segments = useMemo(() => {
    if (!customers) return [];
    const unique = [...new Set(customers.map((c: Customer) => c.segment).filter(Boolean))];
    return unique as string[];
  }, [customers]);

  const handleNext = () => {
    if (step === 1) {
      const nameValid = form.getValues('name').length >= 3;
      const templateValid = !!form.getValues('templateName');
      if (!nameValid || !templateValid) {
        form.trigger(['name', 'templateName']);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (form.getValues('audienceType') === 'custom' && selectedCustomers.length === 0) {
        toast.error('Pilih minimal 1 customer');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as 1 | 2);
    } else {
      router.back();
    }
  };

  const handleSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data);
  });

  const toggleCustomer = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const selectAllCustomers = () => {
    if (customers) {
      setSelectedCustomers(customers.map((c: Customer) => c.id));
    }
  };

  const clearCustomers = () => {
    setSelectedCustomers([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader
        title="Buat Broadcast"
        description={`Langkah ${step} dari 3`}
        backHref={`/${locale}/partner/broadcasts`}
      />

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4 px-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  s === step
                    ? 'bg-primary text-white'
                    : s < step
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
            ))}
          </div>

          {/* Step 1: Template & Name */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Detail Broadcast
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Campaign</FormLabel>
                      <FormControl>
                        <Input placeholder="Promo Lebaran 2026" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="templateName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Pesan</FormLabel>
                      {templatesLoading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates?.map((t: WATemplate) => (
                              <SelectItem key={t.name} value={t.name}>
                                {t.name} ({t.category})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormDescription>
                        Template harus sudah disetujui oleh Meta
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Audience */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-primary" />
                  Pilih Penerima
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="audienceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2 rounded-lg border p-3">
                            <RadioGroupItem value="all" id="all" />
                            <Label htmlFor="all" className="flex-1 cursor-pointer">
                              <p className="font-medium">Semua Customer</p>
                              <p className="text-xs text-muted-foreground">
                                Kirim ke semua {customers?.length || 0} customer
                              </p>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 rounded-lg border p-3">
                            <RadioGroupItem value="segment" id="segment" />
                            <Label htmlFor="segment" className="flex-1 cursor-pointer">
                              <p className="font-medium">Berdasarkan Segmen</p>
                              <p className="text-xs text-muted-foreground">
                                Filter customer berdasarkan segmen
                              </p>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 rounded-lg border p-3">
                            <RadioGroupItem value="custom" id="custom" />
                            <Label htmlFor="custom" className="flex-1 cursor-pointer">
                              <p className="font-medium">Pilih Manual</p>
                              <p className="text-xs text-muted-foreground">
                                Pilih customer satu per satu
                              </p>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Segment Selector */}
                {form.watch('audienceType') === 'segment' && (
                  <FormField
                    control={form.control}
                    name="segment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segmen</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih segmen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {segments.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                )}

                {/* Customer Selector for Custom */}
                {form.watch('audienceType') === 'custom' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Pilih Customer ({selectedCustomers.length} dipilih)</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectAllCustomers}
                        >
                          Pilih Semua
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearCustomers}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    {customersLoading ? (
                      <Skeleton className="h-60 w-full" />
                    ) : (
                      <ScrollArea className="h-60 rounded-lg border">
                        <div className="divide-y">
                          {customers?.map((customer) => (
                            <label
                              key={customer.id}
                              className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted"
                            >
                              <Checkbox
                                checked={selectedCustomers.includes(customer.id)}
                                onCheckedChange={() => toggleCustomer(customer.id)}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{customer.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {customer.phone}
                                </p>
                              </div>
                              {customer.segment && (
                                <Badge variant="secondary" className="text-xs">
                                  {customer.segment}
                                </Badge>
                              )}
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}

                {/* Recipient Count */}
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm">
                    Total penerima:{' '}
                    <span className="font-bold text-primary">
                      {filteredCustomers.length} customer
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Schedule & Send */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-5 w-5 text-primary" />
                  Jadwal Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="sendNow"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(v) => field.onChange(v === 'now')}
                          value={field.value ? 'now' : 'scheduled'}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2 rounded-lg border p-3">
                            <RadioGroupItem value="now" id="now" />
                            <Label htmlFor="now" className="flex-1 cursor-pointer">
                              <p className="font-medium">Kirim Sekarang</p>
                              <p className="text-xs text-muted-foreground">
                                Broadcast langsung dikirim setelah konfirmasi
                              </p>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 rounded-lg border p-3">
                            <RadioGroupItem value="scheduled" id="scheduled" />
                            <Label htmlFor="scheduled" className="flex-1 cursor-pointer">
                              <p className="font-medium">Jadwalkan</p>
                              <p className="text-xs text-muted-foreground">
                                Pilih waktu pengiriman
                              </p>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {!form.watch('sendNow') && (
                  <FormField
                    control={form.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal & Waktu</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {field.value
                                  ? format(field.value, 'd MMMM yyyy, HH:mm', {
                                      locale: idLocale,
                                    })
                                  : 'Pilih tanggal'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                )}

                {/* Summary */}
                <div className="space-y-2 rounded-lg bg-muted p-4">
                  <p className="font-medium">Ringkasan Broadcast</p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Nama:</span>{' '}
                      {form.watch('name')}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Template:</span>{' '}
                      {form.watch('templateName')}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Penerima:</span>{' '}
                      {filteredCustomers.length} customer
                    </p>
                    <p>
                      <span className="text-muted-foreground">Jadwal:</span>{' '}
                      {form.watch('sendNow')
                        ? 'Kirim sekarang'
                        : form.watch('scheduledAt')
                        ? format(form.watch('scheduledAt')!, 'd MMM yyyy, HH:mm', {
                            locale: idLocale,
                          })
                        : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {step === 1 ? 'Batal' : 'Kembali'}
            </Button>
            {step < 3 ? (
              <Button type="button" className="flex-1" onClick={handleNext}>
                Lanjut
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                {createMutation.isPending ? 'Mengirim...' : 'Kirim Broadcast'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

