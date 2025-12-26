/**
 * Partner FAQ Client Component
 * REDESIGNED - Accordion, Search, Category chips
 */

'use client';

import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/partner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Search, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const faqs = [
  {
    category: 'Booking',
    items: [
      { q: 'Bagaimana cara membuat booking?', a: 'Klik tombol Quick Book atau Browse Packages untuk memulai.' },
      { q: 'Berapa lama konfirmasi booking?', a: 'Booking dikonfirmasi maksimal 24 jam setelah pembayaran.' },
    ],
  },
  {
    category: 'Payment',
    items: [
      { q: 'Metode pembayaran apa saja yang tersedia?', a: 'Transfer bank, credit/debit card, dan virtual account.' },
      { q: 'Kapan komisi dibayarkan?', a: 'Komisi dibayarkan setiap akhir bulan.' },
    ],
  },
];

export function FaqClient({ locale }: { locale: string }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = faqs
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="FAQ - Pertanyaan Umum" description="Temukan jawaban cepat" />

      <div className="space-y-6 px-4 pb-20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Cari pertanyaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-10"
          />
        </div>

        {filtered.map((cat) => (
          <div key={cat.category}>
            <h3 className="mb-3 text-sm font-semibold text-primary">{cat.category}</h3>
            <Accordion type="single" collapsible className="space-y-2">
              {cat.items.map((item, idx) => (
                <AccordionItem key={idx} value={`${cat.category}-${idx}`} className="rounded-lg border bg-white px-4">
                  <AccordionTrigger value={`${cat.category}-${idx}`} className="text-left text-sm font-medium hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent value={`${cat.category}-${idx}`} className="text-sm text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}

        <div className="rounded-lg border bg-white p-6 text-center">
          <MessageCircle className="mx-auto mb-3 h-12 w-12 text-primary" />
          <h3 className="mb-2 font-semibold">Masih perlu bantuan?</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Hubungi tim support kami untuk bantuan lebih lanjut
          </p>
          <Button asChild>
            <Link href={`/${locale}/partner/support`}>Hubungi Support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
