/**
 * Inbox AI Parser Component
 * Auto-parse booking inquiries from inbox messages
 */

'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Calendar,
  Loader2,
  MapPin,
  Pencil,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/finance/shadow-pnl';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type ParsedBookingInquiry = {
  packageName?: string;
  destination?: string;
  dateRange?: {
    start: string;
    end?: string;
  };
  paxCount?: {
    adults: number;
    children?: number;
    infants?: number;
  };
  budgetRange?: {
    min?: number;
    max?: number;
    perPax?: boolean;
  };
  specialRequests?: string[];
  confidence: number;
  rawText: string;
};

type InboxAiParserProps = {
  threadId: string;
  messageId?: string;
  onParsed?: (parsed: ParsedBookingInquiry) => void;
  onCreateBooking?: (parsed: ParsedBookingInquiry) => void;
};

export function InboxAiParser({
  threadId,
  messageId,
  onParsed,
  onCreateBooking,
}: InboxAiParserProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedBookingInquiry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ParsedBookingInquiry>>({});

  const handleParse = async () => {
    setIsLoading(true);
    setParsed(null);

    try {
      const response = await fetch(`/api/partner/inbox/${threadId}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          parseThread: !messageId,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit tercapai. Silakan tunggu sebentar.');
          return;
        }
        throw new Error('Failed to parse message');
      }

      const data = await response.json();
      setParsed(data.parsed);
      setEditedData(data.parsed);
      onParsed?.(data.parsed);

      if (data.parsed.confidence >= 70) {
        toast.success('Pesan berhasil diparse dengan akurasi tinggi');
      } else if (data.parsed.confidence >= 40) {
        toast.info('Pesan diparse. Mohon periksa hasilnya.');
      } else {
        toast.warning('Hasil parsing kurang akurat. Mohon edit manual.');
      }
    } catch (error) {
      logger.error('Inbox parse error', error);
      toast.error('Gagal melakukan parsing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBooking = () => {
    if (parsed) {
      onCreateBooking?.(isEditing ? { ...parsed, ...editedData } : parsed);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'bg-green-500';
    if (confidence >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 70) return 'Akurat';
    if (confidence >= 40) return 'Perlu Verifikasi';
    return 'Manual Review';
  };

  if (!parsed) {
    return (
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Parser</span>
              <Badge variant="secondary" className="text-[10px]">Beta</Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleParse}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Parse Pesan
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Ekstrak info booking dari pesan secara otomatis dengan AI
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <span>Hasil Parsing AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn('text-[10px] text-white', getConfidenceColor(parsed.confidence))}>
              {parsed.confidence}% - {getConfidenceLabel(parsed.confidence)}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <X className="h-4 w-4" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-0 pb-4 space-y-4">
        {/* Confidence Progress */}
        <Progress
          value={parsed.confidence}
          className={cn('h-2', `[&>div]:${getConfidenceColor(parsed.confidence)}`)}
        />

        {/* Parsed Data */}
        <div className="grid grid-cols-2 gap-3">
          {/* Destination */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Destinasi
            </Label>
            {isEditing ? (
              <Input
                value={editedData.destination || ''}
                onChange={(e) => setEditedData({ ...editedData, destination: e.target.value })}
                placeholder="Destinasi"
                className="h-8 text-sm"
              />
            ) : (
              <p className="font-medium text-sm">
                {parsed.destination || parsed.packageName || '-'}
              </p>
            )}
          </div>

          {/* Date Range */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Tanggal
            </Label>
            {isEditing ? (
              <Input
                type="date"
                value={editedData.dateRange?.start || ''}
                onChange={(e) => setEditedData({
                  ...editedData,
                  dateRange: { ...editedData.dateRange, start: e.target.value },
                })}
                className="h-8 text-sm"
              />
            ) : (
              <p className="font-medium text-sm">
                {parsed.dateRange?.start
                  ? format(new Date(parsed.dateRange.start), 'd MMM yyyy', { locale: idLocale })
                  : '-'}
                {parsed.dateRange?.end && ` - ${format(new Date(parsed.dateRange.end), 'd MMM yyyy', { locale: idLocale })}`}
              </p>
            )}
          </div>

          {/* Pax Count */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Jumlah Pax
            </Label>
            {isEditing ? (
              <Input
                type="number"
                value={editedData.paxCount?.adults || ''}
                onChange={(e) => setEditedData({
                  ...editedData,
                  paxCount: { ...editedData.paxCount, adults: parseInt(e.target.value) || 0 },
                })}
                placeholder="Jumlah dewasa"
                className="h-8 text-sm"
              />
            ) : (
              <p className="font-medium text-sm">
                {parsed.paxCount ? (
                  <>
                    {parsed.paxCount.adults} dewasa
                    {parsed.paxCount.children && `, ${parsed.paxCount.children} anak`}
                    {parsed.paxCount.infants && `, ${parsed.paxCount.infants} infant`}
                  </>
                ) : (
                  '-'
                )}
              </p>
            )}
          </div>

          {/* Budget */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              Budget
            </Label>
            {isEditing ? (
              <Input
                type="number"
                value={editedData.budgetRange?.max || ''}
                onChange={(e) => setEditedData({
                  ...editedData,
                  budgetRange: { ...editedData.budgetRange, max: parseInt(e.target.value) || 0 },
                })}
                placeholder="Max budget"
                className="h-8 text-sm"
              />
            ) : (
              <p className="font-medium text-sm">
                {parsed.budgetRange?.max
                  ? `${formatCurrency(parsed.budgetRange.max)}${parsed.budgetRange.perPax ? '/pax' : ' total'}`
                  : '-'}
              </p>
            )}
          </div>
        </div>

        {/* Special Requests */}
        {parsed.specialRequests && parsed.specialRequests.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Permintaan Khusus</Label>
            <div className="flex flex-wrap gap-1">
              {parsed.specialRequests.map((req, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {req}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleParse}
            disabled={isLoading}
          >
            <Loader2 className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Re-Parse
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleCreateBooking}
            disabled={!parsed.destination && !parsed.paxCount}
          >
            Buat Booking
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

