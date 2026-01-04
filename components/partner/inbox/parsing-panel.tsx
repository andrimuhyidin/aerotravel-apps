/**
 * Inbox Parsing Panel Component
 * Display parsed booking data and allow editing before creating draft
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/utils/logger';
import { formatCurrency } from '@/lib/partner/package-utils';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Edit,
  Save,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type ParsedData = {
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

type ParsingPanelProps = {
  threadId: string;
  messageId?: string;
  parsedData?: ParsedData;
  onDraftCreated?: (bookingId: string) => void;
};

export function ParsingPanel({
  threadId,
  messageId,
  parsedData,
  onDraftCreated,
}: ParsingPanelProps) {
  const router = useRouter();
  const [parsing, setParsing] = useState(false);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [editing, setEditing] = useState(false);
  const [parsed, setParsed] = useState<ParsedData | null>(parsedData || null);
  const [editedData, setEditedData] = useState<ParsedData | null>(null);

  const handleParse = async () => {
    setParsing(true);
    try {
      const response = await fetch(
        `/api/partner/inbox/${threadId}/parse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            parseThread: !messageId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse message');
      }

      const result = await response.json();
      setParsed(result.parsed);
      setEditedData(result.parsed);
      toast.success('Pesan berhasil di-parse', {
        description: `Confidence: ${result.parsed.confidence}%`,
      });
    } catch (error) {
      logger.error('Parse failed', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Gagal mem-parse pesan. Silakan coba lagi.'
      );
    } finally {
      setParsing(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!parsed && !editedData) return;

    const dataToUse = editedData || parsed;
    if (!dataToUse) return;

    setCreatingDraft(true);
    try {
      const response = await fetch(
        `/api/partner/inbox/${threadId}/create-draft`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parsedData: dataToUse,
            overrideData: editedData !== parsed ? editedData : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create draft');
      }

      const result = await response.json();
      toast.success('Draft booking berhasil dibuat', {
        description: `Booking Code: ${result.bookingCode}`,
      });

      if (onDraftCreated) {
        onDraftCreated(result.bookingId);
      } else {
        router.push(`/partner/bookings/${result.bookingId}`);
      }
    } catch (error) {
      logger.error('Create draft failed', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Gagal membuat draft booking. Silakan coba lagi.'
      );
    } finally {
      setCreatingDraft(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'default';
    return 'destructive';
  };

  if (!parsed && !parsedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Parsing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/70 mb-4">
            Gunakan AI untuk mengekstrak informasi booking dari pesan ini
          </p>
          <Button
            onClick={handleParse}
            disabled={parsing}
            className="w-full"
          >
            {parsing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Parse dengan AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const displayData = editedData || parsed || parsedData;
  if (!displayData) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Data Ter-parse
          </CardTitle>
          <Badge variant={getConfidenceBadge(displayData.confidence)}>
            Confidence: {displayData.confidence}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayData.confidence < 60 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Confidence rendah. Silakan review dan edit data sebelum membuat draft.
            </AlertDescription>
          </Alert>
        )}

        {editing ? (
          <div className="space-y-4">
            <div>
              <Label>Destinasi</Label>
              <Input
                value={editedData?.destination || ''}
                onChange={(e) =>
                  setEditedData({
                    ...displayData,
                    destination: e.target.value || undefined,
                  })
                }
                placeholder="Contoh: Pahawang, Pisang Island"
              />
            </div>

            <div>
              <Label>Tanggal Trip</Label>
              <Input
                type="date"
                value={editedData?.dateRange?.start || ''}
                onChange={(e) =>
                  setEditedData({
                    ...displayData,
                    dateRange: {
                      start: e.target.value,
                      end: editedData?.dateRange?.end,
                    },
                  })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Dewasa</Label>
                <Input
                  type="number"
                  min="1"
                  value={editedData?.paxCount?.adults || 0}
                  onChange={(e) =>
                    setEditedData({
                      ...displayData,
                      paxCount: {
                        adults: parseInt(e.target.value, 10) || 0,
                        children: editedData?.paxCount?.children,
                        infants: editedData?.paxCount?.infants,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label>Anak</Label>
                <Input
                  type="number"
                  min="0"
                  value={editedData?.paxCount?.children || 0}
                  onChange={(e) =>
                    setEditedData({
                      ...displayData,
                      paxCount: {
                        adults: editedData?.paxCount?.adults || 0,
                        children: parseInt(e.target.value, 10) || 0,
                        infants: editedData?.paxCount?.infants,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label>Bayi</Label>
                <Input
                  type="number"
                  min="0"
                  value={editedData?.paxCount?.infants || 0}
                  onChange={(e) =>
                    setEditedData({
                      ...displayData,
                      paxCount: {
                        adults: editedData?.paxCount?.adults || 0,
                        children: editedData?.paxCount?.children,
                        infants: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setEditing(false);
                  setEditedData(parsed || parsedData || null);
                }}
                variant="outline"
              >
                Batal
              </Button>
              <Button
                onClick={() => setEditing(false)}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Simpan
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {displayData.destination && (
              <div>
                <Label className="text-xs text-foreground/70">Destinasi</Label>
                <p className="font-medium">{displayData.destination}</p>
              </div>
            )}

            {displayData.dateRange?.start && (
              <div>
                <Label className="text-xs text-foreground/70">Tanggal Trip</Label>
                <p className="font-medium">
                  {new Date(displayData.dateRange.start).toLocaleDateString('id-ID')}
                  {displayData.dateRange.end && (
                    <span>
                      {' '}- {new Date(displayData.dateRange.end).toLocaleDateString('id-ID')}
                    </span>
                  )}
                </p>
              </div>
            )}

            {displayData.paxCount && (
              <div>
                <Label className="text-xs text-foreground/70">Jumlah Peserta</Label>
                <p className="font-medium">
                  {displayData.paxCount.adults} dewasa
                  {displayData.paxCount.children && displayData.paxCount.children > 0 && (
                    <span>, {displayData.paxCount.children} anak</span>
                  )}
                  {displayData.paxCount.infants && displayData.paxCount.infants > 0 && (
                    <span>, {displayData.paxCount.infants} bayi</span>
                  )}
                </p>
              </div>
            )}

            {displayData.budgetRange && (
              <div>
                <Label className="text-xs text-foreground/70">Budget</Label>
                <p className="font-medium">
                  {displayData.budgetRange.min && (
                    <span>{formatCurrency(displayData.budgetRange.min)}</span>
                  )}
                  {displayData.budgetRange.min && displayData.budgetRange.max && ' - '}
                  {displayData.budgetRange.max && (
                    <span>{formatCurrency(displayData.budgetRange.max)}</span>
                  )}
                  {displayData.budgetRange.perPax && ' /pax'}
                </p>
              </div>
            )}

            {displayData.specialRequests && displayData.specialRequests.length > 0 && (
              <div>
                <Label className="text-xs text-foreground/70">Request Khusus</Label>
                <ul className="list-disc list-inside text-sm">
                  {displayData.specialRequests.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={handleCreateDraft}
                disabled={creatingDraft}
                className="flex-1"
              >
                {creatingDraft ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Membuat...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Buat Draft Booking
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

