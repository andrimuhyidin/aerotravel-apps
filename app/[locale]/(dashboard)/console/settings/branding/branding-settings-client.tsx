/**
 * Branding Settings Client
 * Manage branding, contact, social, SEO, business, and stats settings
 */

'use client';

import { Palette } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsCategory } from '@/components/admin/settings/settings-category';

export function BrandingSettingsClient() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Palette className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Branding & Company</h1>
          <p className="text-sm text-muted-foreground">
            Logo, identitas, kontak, dan informasi perusahaan
          </p>
        </div>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto gap-1 p-1">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="contact">Kontak</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="business">Bisnis</TabsTrigger>
          <TabsTrigger value="stats">Statistik</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="mt-6">
          <SettingsCategory
            title="Branding"
            description="Logo, warna, dan identitas visual"
            prefixes={['branding.']}
          />
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          <SettingsCategory
            title="Informasi Kontak"
            description="Email, telepon, WhatsApp, dan alamat"
            prefixes={['contact.']}
          />
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <SettingsCategory
            title="Social Media"
            description="Link akun social media perusahaan"
            prefixes={['social.']}
          />
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <SettingsCategory
            title="SEO Settings"
            description="Meta title, description, dan keywords"
            prefixes={['seo.']}
          />
        </TabsContent>

        <TabsContent value="business" className="mt-6">
          <SettingsCategory
            title="Informasi Bisnis"
            description="Nama perusahaan, NPWP, SIUP, dan legalitas"
            prefixes={['business.']}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <SettingsCategory
            title="Statistik Display"
            description="Angka statistik yang ditampilkan di landing page"
            prefixes={['stats.']}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

