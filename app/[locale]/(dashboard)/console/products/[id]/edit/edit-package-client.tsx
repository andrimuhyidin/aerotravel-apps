/**
 * Edit Package Client Component
 * Wrapper for edit package form with data transformation
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useValidationSettings } from '@/hooks/use-validation-settings';

type PackageData = {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  package_type: string;
  status: 'draft' | 'published' | 'archived';
  destination: string;
  city: string | null;
  province: string | null;
  duration_days: number;
  duration_nights: number;
  min_pax: number;
  max_pax: number;
  inclusions: string[] | null;
  exclusions: string[] | null;
  thumbnail_url: string | null;
  package_prices: Array<{
    id: string;
    min_pax: number;
    max_pax: number;
    price_publish: number;
    price_nta: number;
    price_weekend: number | null;
    is_active: boolean;
  }>;
};

type EditPackageClientProps = {
  packageData: PackageData;
  locale: string;
};

function createPackageFormSchema(v: {
  packageCodeMinLength: number;
  packageCodeMaxLength: number;
  packageNameMinLength: number;
  packageNameMaxLength: number;
  slugMinLength: number;
  slugMaxLength: number;
  shortDescriptionMaxLength: number;
  minPaxMinimum: number;
  maxPaxMinimum: number;
}) {
  return z.object({
    name: z
      .string()
      .min(v.packageNameMinLength, `Name must be at least ${v.packageNameMinLength} characters`)
      .max(v.packageNameMaxLength, `Name must be at most ${v.packageNameMaxLength} characters`),
    slug: z
      .string()
      .min(v.slugMinLength, `Slug must be at least ${v.slugMinLength} characters`)
      .max(v.slugMaxLength, `Slug must be at most ${v.slugMaxLength} characters`),
    description: z.string().optional(),
    shortDescription: z.string().max(v.shortDescriptionMaxLength, `Max ${v.shortDescriptionMaxLength} characters`).optional(),
    packageType: z.enum(['open_trip', 'private_trip', 'corporate', 'kol_trip']),
    destination: z.string().min(2, 'Destination is required').max(200),
    city: z.string().max(100).optional(),
    province: z.string().max(100).optional(),
    durationDays: z.coerce.number().int().min(1, 'Duration must be at least 1 day'),
    durationNights: z.coerce.number().int().min(0),
    minPax: z.coerce.number().int().min(v.minPaxMinimum, `Minimum ${v.minPaxMinimum} pax`),
    maxPax: z.coerce.number().int().min(v.maxPaxMinimum, `Maximum must be at least ${v.maxPaxMinimum}`),
    inclusions: z.string().optional(),
    exclusions: z.string().optional(),
    thumbnailUrl: z.string().url().optional().or(z.literal('')),
    status: z.enum(['draft', 'published', 'archived']),
  });
}

type PackageFormValues = z.infer<ReturnType<typeof createPackageFormSchema>>;

export function EditPackageClient({ packageData, locale }: EditPackageClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings: validationSettings, isLoading: isLoadingSettings } = useValidationSettings();

  const packageFormSchema = useMemo(
    () => createPackageFormSchema(validationSettings),
    [validationSettings]
  );

  // Transform package data to form format
  const defaultValues = useMemo(() => {
    return {
      name: packageData.name,
      slug: packageData.slug,
      description: packageData.description || '',
      shortDescription: packageData.short_description || '',
      packageType: packageData.package_type as 'open_trip' | 'private_trip' | 'corporate' | 'kol_trip',
      destination: packageData.destination,
      city: packageData.city || '',
      province: packageData.province || '',
      durationDays: packageData.duration_days,
      durationNights: packageData.duration_nights,
      minPax: packageData.min_pax,
      maxPax: packageData.max_pax,
      inclusions: packageData.inclusions?.join('\n') || '',
      exclusions: packageData.exclusions?.join('\n') || '',
      thumbnailUrl: packageData.thumbnail_url || '',
      status: packageData.status,
    };
  }, [packageData]);

  const form = useForm<PackageFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(packageFormSchema) as any,
    defaultValues,
  });

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const onSubmit = async (data: PackageFormValues) => {
    setIsSubmitting(true);
    try {
      // Parse inclusions/exclusions from textarea
      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        packageType: data.packageType,
        destination: data.destination,
        city: data.city,
        province: data.province,
        durationDays: data.durationDays,
        durationNights: data.durationNights,
        minPax: data.minPax,
        maxPax: data.maxPax,
        inclusions: data.inclusions
          ? data.inclusions.split('\n').filter((line) => line.trim())
          : undefined,
        exclusions: data.exclusions
          ? data.exclusions.split('\n').filter((line) => line.trim())
          : undefined,
        thumbnailUrl: data.thumbnailUrl,
        status: data.status,
      };

      const response = await fetch(`/api/admin/packages/${packageData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update package');
      }

      toast.success('Package updated successfully');
      router.push(`/${locale}/console/products/${packageData.id}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update package'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/console/products/${packageData.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Package</h1>
          <p className="text-muted-foreground">
            {packageData.code}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="space-y-6 lg:col-span-2">
              {/* Read-only Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Package Information</CardTitle>
                  <CardDescription>
                    Information that cannot be changed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Package Code
                    </label>
                    <p className="text-sm font-mono">{packageData.code}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="packageType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Package Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="open_trip">Open Trip</SelectItem>
                              <SelectItem value="private_trip">Private Trip</SelectItem>
                              <SelectItem value="corporate">Corporate</SelectItem>
                              <SelectItem value="kol_trip">KOL Trip</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Bromo Sunrise Adventure"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug *</FormLabel>
                        <FormControl>
                          <Input placeholder="bromo-sunrise-adventure" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination *</FormLabel>
                        <FormControl>
                          <Input placeholder="Bromo Tengger Semeru" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Malang" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Province</FormLabel>
                          <FormControl>
                            <Input placeholder="Jawa Timur" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="durationDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (Days) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="durationNights"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (Nights) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="minPax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Pax *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxPax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Pax *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description (max 500 characters)"
                            rows={3}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Full package description"
                            rows={6}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inclusions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inclusions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="One item per line"
                            rows={4}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter one inclusion per line
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exclusions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exclusions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="One item per line"
                            rows={4}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter one exclusion per line
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thumbnailUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thumbnail URL</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Actions */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

