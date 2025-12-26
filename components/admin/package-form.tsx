'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Save, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

const packageFormSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20),
  name: z.string().min(3, 'Name must be at least 3 characters').max(200),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  packageType: z.enum(['open_trip', 'private_trip', 'corporate', 'kol_trip']),
  destination: z.string().min(2, 'Destination is required').max(200),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  durationDays: z.coerce.number().int().min(1, 'Duration must be at least 1 day'),
  durationNights: z.coerce.number().int().min(0),
  minPax: z.coerce.number().int().min(1, 'Minimum 1 pax'),
  maxPax: z.coerce.number().int().min(1, 'Maximum must be at least 1'),
  inclusions: z.string().optional(),
  exclusions: z.string().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  priceTiers: z.array(
    z.object({
      minPax: z.coerce.number().int().min(1),
      maxPax: z.coerce.number().int().min(1),
      pricePublish: z.coerce.number().min(0),
      priceNta: z.coerce.number().min(0),
      priceWeekend: z.coerce.number().min(0).optional(),
    })
  ).min(1, 'At least one price tier is required'),
});

type PackageFormValues = z.infer<typeof packageFormSchema>;

export function PackageForm({
  initialData,
  mode = 'create',
}: {
  initialData?: Partial<PackageFormValues>;
  mode?: 'create' | 'edit';
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: initialData || {
      packageType: 'open_trip',
      durationDays: 1,
      durationNights: 0,
      minPax: 1,
      maxPax: 20,
      priceTiers: [
        {
          minPax: 1,
          maxPax: 5,
          pricePublish: 0,
          priceNta: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'priceTiers',
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const onSubmit = async (data: PackageFormValues) => {
    setIsSubmitting(true);
    try {
      // Parse inclusions/exclusions from textarea
      const payload = {
        ...data,
        inclusions: data.inclusions
          ? data.inclusions.split('\n').filter((line) => line.trim())
          : undefined,
        exclusions: data.exclusions
          ? data.exclusions.split('\n').filter((line) => line.trim())
          : undefined,
      };

      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create package');
      }

      const result = await response.json();

      toast.success('Package created successfully');

      router.push(`/console/products/${result.package.id}`);
      router.refresh();
    } catch (error) {
      logger.error('Failed to create package', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create package');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="PKG-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="packageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      onBlur={(e) => {
                        field.onBlur();
                        if (!form.getValues('slug')) {
                          form.setValue('slug', generateSlug(e.target.value));
                        }
                      }}
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
                  <FormDescription>URL-friendly version of the name</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description for listings..."
                      className="min-h-[80px]"
                      {...field}
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
                  <FormLabel>Full Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed package description..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Destination & Duration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination *</FormLabel>
                    <FormControl>
                      <Input placeholder="Bromo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Probolinggo" {...field} />
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
                      <Input placeholder="Jawa Timur" {...field} />
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
                      <Input type="number" min="1" {...field} />
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
                      <Input type="number" min="0" {...field} />
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
                    <FormLabel>Minimum Pax *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
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
                    <FormLabel>Maximum Pax *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Tiers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Tier {index + 1}</CardTitle>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`priceTiers.${index}.minPax`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Pax *</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`priceTiers.${index}.maxPax`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Pax *</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name={`priceTiers.${index}.pricePublish`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Publish Price *</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="1000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`priceTiers.${index}.priceNta`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NTA Price *</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="1000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`priceTiers.${index}.priceWeekend`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weekend Price</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="1000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  minPax: 1,
                  maxPax: 5,
                  pricePublish: 0,
                  priceNta: 0,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Price Tier
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inclusions & Exclusions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="inclusions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inclusions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter each inclusion on a new line..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>One item per line</FormDescription>
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
                      placeholder="Enter each exclusion on a new line..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>One item per line</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormDescription>Direct URL to package thumbnail image</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Package' : 'Update Package'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

