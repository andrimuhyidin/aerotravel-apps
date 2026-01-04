'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Navigation,
  Save,
  TestTube,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { GlassCard } from '@/components/ui/glass-card';

// Form schema
const mapsSettingsSchema = z.object({
  provider: z.enum(['google', 'mapbox']),
  api_key: z.string().optional(),
  default_lat: z.number().min(-90).max(90),
  default_lng: z.number().min(-180).max(180),
  default_zoom: z.number().min(1).max(20),
  route_optimization_enabled: z.boolean(),
});

type MapsSettingsFormData = z.infer<typeof mapsSettingsSchema>;

// Common locations in Indonesia
const quickLocations = [
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
  { name: 'Bali (Denpasar)', lat: -8.6705, lng: 115.2126 },
  { name: 'Labuan Bajo', lat: -8.4814, lng: 119.8775 },
  { name: 'Raja Ampat', lat: -0.2346, lng: 130.5162 },
  { name: 'Yogyakarta', lat: -7.7956, lng: 110.3695 },
  { name: 'Lombok', lat: -8.6529, lng: 116.3249 },
];

export function MapsSettingsClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const form = useForm<MapsSettingsFormData>({
    resolver: zodResolver(mapsSettingsSchema),
    defaultValues: {
      provider: 'google',
      api_key: '',
      default_lat: -6.2088,
      default_lng: 106.8456,
      default_zoom: 12,
      route_optimization_enabled: true,
    },
  });

  const onSubmit = async (data: MapsSettingsFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Maps configuration has been updated successfully.');
    } catch {
      toast.error('Failed to save Maps settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/admin/settings/maps/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: form.getValues('provider'),
          api_key: form.getValues('api_key'),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Connected to ${form.getValues('provider')} Maps API successfully.`);
      } else {
        throw new Error(result.message || 'Connection failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not connect to Maps API.');
    } finally {
      setIsTesting(false);
    }
  };

  const setQuickLocation = (location: (typeof quickLocations)[0]) => {
    form.setValue('default_lat', location.lat);
    form.setValue('default_lng', location.lng);
    toast.success(`Default location set to ${location.name}.`);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Provider & API Key Card */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Maps Provider</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="google">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Google Maps
                          </div>
                        </SelectItem>
                        <SelectItem value="mapbox">
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4" />
                            Mapbox
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Google Maps recommended for Indonesia coverage.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-6" />

            {/* API Key */}
            <FormField
              control={form.control}
              name="api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showApiKey ? 'text' : 'password'}
                          placeholder="Enter your Maps API key"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={testConnection}
                        disabled={isTesting || !field.value}
                      >
                        {isTesting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <TestTube className="h-4 w-4 mr-2" />
                        )}
                        Test
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    API key is encrypted before storage. Leave empty to use .env fallback.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </GlassCard>

          {/* Default Location Card */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-4">Default Location</h2>

            {/* Quick Location Buttons */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">Quick Select:</p>
              <div className="flex flex-wrap gap-2">
                {quickLocations.map((location) => (
                  <Button
                    key={location.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickLocation(location)}
                  >
                    {location.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="default_lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Latitude: <Badge variant="secondary">{field.value.toFixed(4)}</Badge>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      -90 to 90
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_lng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Longitude: <Badge variant="secondary">{field.value.toFixed(4)}</Badge>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      -180 to 180
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_zoom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Zoom Level: <Badge variant="secondary">{field.value}</Badge>
                    </FormLabel>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        min={1}
                        max={20}
                        step={1}
                        className="mt-2"
                      />
                    </FormControl>
                    <FormDescription>
                      1 = World, 20 = Buildings
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </GlassCard>

          {/* Features Card */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-4">Map Features</h2>

            <FormField
              control={form.control}
              name="route_optimization_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      <FormLabel className="text-base">Route Optimization</FormLabel>
                    </div>
                    <FormDescription>
                      Enable automatic route optimization for multi-stop trips.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </GlassCard>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Configuration
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

