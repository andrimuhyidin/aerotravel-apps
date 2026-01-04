/**
 * Package FAQ Section Component
 * Expandable accordion for frequently asked questions
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Search, MessageCircle, HelpCircle, Loader2 } from 'lucide-react';
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

type PackageFAQSectionProps = {
  packageId?: string;
};

export function PackageFAQSection({ packageId }: PackageFAQSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch FAQs from API
  const { data: faqsData, isLoading } = useQuery<{ faqs: Array<{ id: string; question: string; answer: string; category: string | null }> }>({
    queryKey: ['faqs', 'package', packageId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('app_type', 'package');
      if (packageId) params.append('package_id', packageId);
      const res = await fetch(`/api/faqs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch FAQs');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transform FAQs to match component format
  const faqs: FAQItem[] = (faqsData?.faqs || []).map((faq) => ({
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    category: (faq.category as FAQItem['category']) || 'general',
  }));

  // Filter FAQs by search and category
  const filteredFAQs = faqs.filter((faq) => {
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
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Memuat FAQ...</p>
          </CardContent>
        </Card>
      ) : filteredFAQs.length === 0 ? (
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

