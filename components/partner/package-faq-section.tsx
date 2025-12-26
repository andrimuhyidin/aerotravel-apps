/**
 * Package FAQ Section Component
 * Expandable accordion for frequently asked questions
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: 'payment' | 'cancellation' | 'itinerary' | 'documents' | 'general';
};

const CATEGORY_LABELS = {
  payment: 'Pembayaran',
  cancellation: 'Pembatalan',
  itinerary: 'Itinerary',
  documents: 'Dokumen',
  general: 'Umum',
};

const CATEGORY_COLORS = {
  payment: 'bg-blue-100 text-blue-700',
  cancellation: 'bg-red-100 text-red-700',
  itinerary: 'bg-green-100 text-green-700',
  documents: 'bg-yellow-100 text-yellow-700',
  general: 'bg-gray-100 text-gray-700',
};

// Mock FAQ data - TODO: Fetch from API when available
const MOCK_FAQS: FAQItem[] = [
  {
    id: '1',
    question: 'Bagaimana cara melakukan pembayaran?',
    answer: 'Pembayaran dapat dilakukan melalui transfer bank, kartu kredit, atau e-wallet. Setelah booking dikonfirmasi, Anda akan menerima invoice dengan instruksi pembayaran lengkap.',
    category: 'payment',
  },
  {
    id: '2',
    question: 'Apakah bisa request perubahan itinerary?',
    answer: 'Perubahan itinerary dimungkinkan dengan persetujuan guide dan dapat dikenakan biaya tambahan tergantung jenis perubahan yang diminta. Harap menghubungi kami minimal 7 hari sebelum keberangkatan.',
    category: 'itinerary',
  },
  {
    id: '3',
    question: 'Dokumen apa saja yang perlu disiapkan?',
    answer: 'Dokumen wajib: KTP/Paspor yang masih berlaku, bukti pembayaran, dan voucher trip. Untuk destinasi tertentu mungkin diperlukan dokumen tambahan seperti surat keterangan sehat atau vaksinasi.',
    category: 'documents',
  },
  {
    id: '4',
    question: 'Bagaimana kebijakan pembatalan trip?',
    answer: 'Pembatalan 30+ hari sebelum keberangkatan: refund 100%. Pembatalan 15-29 hari: refund 50%. Pembatalan <14 hari: tidak ada refund. Untuk kondisi force majeure akan ditinjau case by case.',
    category: 'cancellation',
  },
  {
    id: '5',
    question: 'Apakah harga sudah termasuk asuransi perjalanan?',
    answer: 'Harga paket belum termasuk asuransi perjalanan. Kami sangat merekomendasikan untuk mengambil asuransi perjalanan untuk keamanan dan kenyamanan Anda.',
    category: 'payment',
  },
  {
    id: '6',
    question: 'Berapa minimal peserta untuk trip ini?',
    answer: 'Minimal peserta untuk private trip adalah 2 pax. Untuk open trip, minimal kuota adalah 10 pax. Jika kuota tidak terpenuhi, trip dapat dibatalkan atau dijadwalkan ulang.',
    category: 'general',
  },
  {
    id: '7',
    question: 'Apakah tersedia pilihan upgrade hotel atau kendaraan?',
    answer: 'Ya, upgrade tersedia dengan biaya tambahan. Silakan menghubungi kami untuk pilihan upgrade dan informasi harga.',
    category: 'itinerary',
  },
  {
    id: '8',
    question: 'Bagaimana jika ada perubahan jadwal dari pihak operator?',
    answer: 'Jika terjadi perubahan dari pihak kami, Anda akan diberitahu minimal 7 hari sebelumnya. Anda berhak untuk reschedule tanpa biaya atau full refund.',
    category: 'cancellation',
  },
];

type PackageFAQSectionProps = {
  packageId?: string;
};

export function PackageFAQSection({ packageId }: PackageFAQSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter FAQs by search and category
  const filteredFAQs = MOCK_FAQS.filter((faq) => {
    const matchesSearch = searchQuery
      ? faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesCategory = selectedCategory
      ? faq.category === selectedCategory
      : true;

    return matchesSearch && matchesCategory;
  });

  // Group FAQs by category
  const categories = Array.from(new Set(filteredFAQs.map((faq) => faq.category)));

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari pertanyaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              Semua
            </Badge>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <Badge
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(key)}
              >
                {label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ List */}
      {filteredFAQs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">Tidak ada hasil ditemukan</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Coba kata kunci lain atau hubungi kami untuk pertanyaan spesifik
            </p>
            <Button variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Hubungi Kami
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pertanyaan yang Sering Diajukan</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQs.map((faq, index) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-3 pr-4">
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', CATEGORY_COLORS[faq.category])}
                      >
                        {CATEGORY_LABELS[faq.category]}
                      </Badge>
                      <span className="font-medium">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground leading-relaxed pl-16">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Contact CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-6 text-center">
          <h3 className="font-semibold mb-2">Tidak menemukan jawaban?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tim kami siap membantu menjawab pertanyaan Anda
          </p>
          <Button className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Hubungi Customer Service
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

