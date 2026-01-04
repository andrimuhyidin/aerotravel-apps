'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertTriangle,
  Clock,
  CloudRain,
  Eye,
  EyeOff,
  Loader2,
  Save,
  TestTube,
  Waves,
  Wind,
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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { GlassCard } from '@/components/ui/glass-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Form schema
const weatherSettingsSchema = z.object({
  enabled: z.boolean(),
  api_key: z.string().optional(),
  wind_threshold: z.number().min(10).max(100),
  rain_threshold: z.number().min(10).max(200),
  wave_threshold: z.number().min(0.5).max(5),
  check_interval_hours: z.number().min(1).max(24),
});

type WeatherSettingsFormData = z.infer<typeof weatherSettingsSchema>;

export function WeatherSettingsClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const form = useForm<WeatherSettingsFormData>({
    resolver: zodResolver(weatherSettingsSchema),
    defaultValues: {
      enabled: true,
      api_key: '',
      wind_threshold: 40,
      rain_threshold: 50,
      wave_threshold: 2,
      check_interval_hours: 3,
    },
  });

  const isEnabled = form.watch('enabled');

  const onSubmit = async (data: WeatherSettingsFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Weather alerts configuration has been updated successfully.');
    } catch {
      toast.error('Failed to save Weather settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/admin/settings/weather/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: form.getValues('api_key'),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Weather API connected. Current temp: ${result.data?.temp || 'N/A'}°C`);
      } else {
        throw new Error(result.message || 'Connection failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not connect to Weather API.');
    } finally {
      setIsTesting(false);
    }
  };

  // Get severity based on threshold
  const getWindSeverity = (value: number) => {
    if (value < 30) return 'low';
    if (value < 50) return 'medium';
    return 'high';
  };

  const getRainSeverity = (value: number) => {
    if (value < 30) return 'low';
    if (value < 75) return 'medium';
    return 'high';
  };

  const getWaveSeverity = (value: number) => {
    if (value < 1.5) return 'low';
    if (value < 2.5) return 'medium';
    return 'high';
  };

  const severityColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Enable/Disable Card */}
          <GlassCard className="p-6">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-primary" />
                      <FormLabel className="text-lg font-semibold">Weather Alerts</FormLabel>
                    </div>
                    <FormDescription>
                      Enable weather monitoring and alerts for trip safety.
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

          {isEnabled && (
            <>
              {/* API Key Card */}
              <GlassCard className="p-6">
                <h2 className="text-lg font-semibold mb-4">Weather API</h2>

                <FormField
                  control={form.control}
                  name="api_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OpenWeatherMap API Key</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showApiKey ? 'text' : 'password'}
                              placeholder="Enter your OpenWeatherMap API key"
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
                        Get your free API key at{' '}
                        <a
                          href="https://openweathermap.org/api"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          openweathermap.org
                        </a>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-6" />

                <FormField
                  control={form.control}
                  name="check_interval_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Check Interval: <Badge variant="secondary">{field.value} hours</Badge>
                        </div>
                      </FormLabel>
                      <FormControl>
                        <Slider
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          min={1}
                          max={24}
                          step={1}
                          className="mt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        How often to check weather conditions (1-24 hours).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </GlassCard>

              {/* Alert Thresholds Card */}
              <GlassCard className="p-6">
                <h2 className="text-lg font-semibold mb-4">Alert Thresholds</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Set thresholds for weather alerts. Trips will be flagged when conditions exceed these values.
                </p>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Wind Threshold */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Wind className="h-4 w-4" />
                        Wind Speed
                      </CardTitle>
                      <CardDescription>Maximum safe wind speed</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="wind_threshold"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between mb-2">
                              <Badge
                                variant="secondary"
                                className={severityColors[getWindSeverity(field.value)]}
                              >
                                {field.value} km/h
                              </Badge>
                            </div>
                            <FormControl>
                              <Slider
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={10}
                                max={100}
                                step={5}
                              />
                            </FormControl>
                            <FormDescription className="text-xs mt-2">
                              &lt;30: Low, 30-50: Medium, &gt;50: High risk
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Rain Threshold */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CloudRain className="h-4 w-4" />
                        Rainfall
                      </CardTitle>
                      <CardDescription>Maximum precipitation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="rain_threshold"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between mb-2">
                              <Badge
                                variant="secondary"
                                className={severityColors[getRainSeverity(field.value)]}
                              >
                                {field.value} mm
                              </Badge>
                            </div>
                            <FormControl>
                              <Slider
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={10}
                                max={200}
                                step={10}
                              />
                            </FormControl>
                            <FormDescription className="text-xs mt-2">
                              &lt;30: Light, 30-75: Moderate, &gt;75: Heavy
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Wave Threshold */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Waves className="h-4 w-4" />
                        Wave Height
                      </CardTitle>
                      <CardDescription>Maximum safe wave height</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="wave_threshold"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between mb-2">
                              <Badge
                                variant="secondary"
                                className={severityColors[getWaveSeverity(field.value)]}
                              >
                                {field.value} m
                              </Badge>
                            </div>
                            <FormControl>
                              <Slider
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={0.5}
                                max={5}
                                step={0.5}
                              />
                            </FormControl>
                            <FormDescription className="text-xs mt-2">
                              &lt;1.5m: Calm, 1.5-2.5m: Moderate, &gt;2.5m: Rough
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </GlassCard>
            </>
          )}

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

