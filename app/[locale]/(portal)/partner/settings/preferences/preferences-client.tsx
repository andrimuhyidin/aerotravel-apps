/**
 * Partner Preferences Client Component
 * Language & Timezone Settings
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/partner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Clock, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const LANGUAGES = [
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'en', label: 'English' },
];

const TIMEZONES = [
  { value: 'Asia/Jakarta', label: 'WIB (UTC+7) - Jakarta' },
  { value: 'Asia/Makassar', label: 'WITA (UTC+8) - Makassar' },
  { value: 'Asia/Jayapura', label: 'WIT (UTC+9) - Jayapura' },
];

export function PreferencesClient({ locale }: { locale: string }) {
  const router = useRouter();
  const [language, setLanguage] = useState(locale);
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // If language changed, redirect to new locale
      if (language !== locale) {
        router.push(`/${language}/partner/settings`);
        toast.success('Pengaturan berhasil disimpan!');
      } else {
        toast.success('Pengaturan berhasil disimpan!');
        router.push(`/${locale}/partner/settings`);
      }
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Bahasa & Zona Waktu"
        description="Atur preferensi bahasa dan zona waktu"
      />

      {/* Content */}
      <div className="space-y-4 px-4 pb-20">
        {/* Back Button */}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-2"
        >
          <Link href={`/${locale}/partner/settings`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Pengaturan
          </Link>
        </Button>

        {/* Language Selection */}
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Bahasa</h3>
                <p className="text-xs text-muted-foreground">
                  Pilih bahasa untuk tampilan dashboard
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Bahasa Dashboard</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Pilih bahasa" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-xs text-blue-900">
                Perubahan bahasa akan memuat ulang dashboard dengan bahasa yang dipilih.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Timezone Selection */}
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Zona Waktu</h3>
                <p className="text-xs text-muted-foreground">
                  Pilih zona waktu untuk tampilan tanggal & waktu
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Zona Waktu</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Pilih zona waktu" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-purple-50 p-3">
              <p className="text-xs text-purple-900">
                Zona waktu akan mempengaruhi tampilan jadwal booking, laporan, dan notifikasi.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <h3 className="mb-3 font-semibold text-foreground">Preview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bahasa:</span>
                <span className="font-medium">
                  {LANGUAGES.find((l) => l.value === language)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zona Waktu:</span>
                <span className="font-medium">
                  {TIMEZONES.find((tz) => tz.value === timezone)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Waktu Sekarang:</span>
                <span className="font-medium">
                  {new Date().toLocaleString(language === 'id' ? 'id-ID' : 'en-US', {
                    timeZone: timezone,
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>
    </div>
  );
}

