'use client';

/**
 * Incident Report Form Component
 * Form untuk melaporkan kejadian insiden
 */

import {
  AlertCircle,
  Bot,
  Camera,
  FileText,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SignaturePad,
  type SignatureData,
} from '@/components/ui/signature-pad';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type IncidentFormProps = {
  guideId: string;
  tripId?: string;
};

type IncidentType =
  | 'accident'
  | 'injury'
  | 'equipment_damage'
  | 'weather_issue'
  | 'complaint'
  | 'other';

const incidentTypes: Array<{ value: IncidentType; label: string }> = [
  { value: 'accident', label: 'Kecelakaan' },
  { value: 'injury', label: 'Cedera/Kecelakaan' },
  { value: 'equipment_damage', label: 'Kerusakan Peralatan' },
  { value: 'weather_issue', label: 'Masalah Cuaca' },
  { value: 'complaint', label: 'Keluhan' },
  { value: 'other', label: 'Lainnya' },
];

type Passenger = {
  id: string;
  full_name: string;
  phone?: string | null;
  passenger_type: string;
};

type Injury = {
  person_id: string;
  person_type: 'passenger' | 'guide' | 'crew' | 'other';
  body_part: 'head' | 'torso' | 'arm' | 'leg' | 'other';
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  first_aid_given: boolean;
  first_aid_description?: string;
  hospital_required: boolean;
  hospital_name?: string;
};

export function IncidentForm({ guideId, tripId }: IncidentFormProps) {
  const [incidentType, setIncidentType] = useState<IncidentType | ''>('');
  const [chronology, setChronology] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [involvedPassengerIds, setInvolvedPassengerIds] = useState<string[]>(
    []
  );
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [signature, setSignature] = useState<SignatureData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch manifest if tripId is provided
  const { data: manifestData } = useQuery<{
    passengers: Array<
      Passenger & { status: 'pending' | 'boarded' | 'returned' }
    >;
  }>({
    queryKey: ['manifest', tripId],
    queryFn: async () => {
      if (!tripId) return { passengers: [] };
      const res = await fetch(`/api/guide/manifest?tripId=${tripId}`);
      if (!res.ok) return { passengers: [] };
      return res.json();
    },
    enabled: !!tripId,
    staleTime: 300000, // 5 minutes
  });

  const passengers = manifestData?.passengers || [];

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, 5);

    if (imageFiles.length + photos.length > 5) {
      setMessage({ type: 'error', text: 'Maksimal 5 foto' });
      return;
    }

    setPhotos((prev) => [...prev, ...imageFiles]);
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const [aiReport, setAiReport] = useState<{
    summary?: string;
    what?: string;
    when?: string;
    where?: string;
    severity?: string;
    immediateActions?: string[];
  } | null>(null);
  const [generatingAiReport, setGeneratingAiReport] = useState(false);

  const generateAiReport = async () => {
    if (!chronology.trim()) {
      setMessage({
        type: 'error',
        text: 'Mohon isi kronologi terlebih dahulu',
      });
      return;
    }

    setGeneratingAiReport(true);
    try {
      // Convert photos to base64
      const images = await Promise.all(
        photos.map(async (photo) => {
          const arrayBuffer = await photo.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          return {
            base64: buffer.toString('base64'),
            mimeType: photo.type as
              | 'image/png'
              | 'image/jpeg'
              | 'image/webp'
              | 'image/gif',
          };
        })
      );

      const res = await fetch('/api/guide/incidents/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'report',
          description: chronology,
          images: images.length > 0 ? images : undefined,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { report: typeof aiReport };
        setAiReport(data.report);
        setMessage({ type: 'success', text: 'AI report berhasil dibuat' });
      }
    } catch (error) {
      logger.error('Failed to generate AI report', error);
      setMessage({ type: 'error', text: 'Gagal membuat AI report' });
    } finally {
      setGeneratingAiReport(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    if (!incidentType || !chronology.trim()) {
      setMessage({
        type: 'error',
        text: 'Mohon isi jenis insiden dan kronologi',
      });
      setSubmitting(false);
      return;
    }

    if (!signature) {
      setMessage({
        type: 'error',
        text: 'Mohon berikan tanda tangan untuk konfirmasi data akurat',
      });
      setSubmitting(false);
      return;
    }

    try {
      // Upload photos first if any
      const photoUrls: string[] = [];
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach((photo, index) => {
          formData.append(`photo_${index}`, photo);
        });
        formData.append('guideId', guideId);
        formData.append('tripId', tripId || '');

        const uploadRes = await fetch('/api/guide/incidents/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = (await uploadRes.json()) as { urls: string[] };
          photoUrls.push(...uploadData.urls);
        }
      }

      // Prepare involved people data
      const involvedPeople =
        involvedPassengerIds.length > 0
          ? involvedPassengerIds.map((passengerId) => ({
              person_id: passengerId,
              person_type: 'passenger' as const,
              role_in_incident: undefined,
              notes: undefined,
            }))
          : undefined;

      // Validate injuries if incident type is injury
      if (incidentType === 'injury' && injuries.length === 0) {
        setMessage({
          type: 'error',
          text: 'Mohon tambahkan detail cedera untuk insiden cedera',
        });
        setSubmitting(false);
        return;
      }

      // Submit incident report
      const res = await fetch('/api/guide/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentType,
          chronology: chronology.trim(),
          witnesses: witnesses.trim() || undefined,
          involved_people: involvedPeople,
          injuries: injuries.length > 0 ? injuries : undefined,
          photoUrls,
          tripId: tripId || undefined,
          signature: signature
            ? {
                method: signature.method,
                data: signature.data,
              }
            : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setMessage({
          type: 'error',
          text: errorData.error || 'Gagal mengirim laporan insiden',
        });
      } else {
        const data = (await res.json()) as { reportNumber?: string };
        const reportNumber = data.reportNumber || 'N/A';
        setMessage({
          type: 'success',
          text: `Laporan insiden berhasil dikirim (${reportNumber}). Notifikasi telah dikirim ke asuransi & admin.`,
        });
        toast.success(`Laporan insiden ${reportNumber} berhasil dikirim`);

        // Reset form
        setIncidentType('');
        setChronology('');
        setWitnesses('');
        setInvolvedPassengerIds([]);
        setInjuries([]);
        setPhotos([]);
        setPhotoPreviews([]);
        setSignature(null);
        setAiReport(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (_error) {
      setMessage({
        type: 'error',
        text: 'Gagal mengirim laporan. Periksa koneksi internet.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5 text-slate-600" />
          Formulir Laporan Insiden
        </CardTitle>
        <p className="mt-1 text-xs text-slate-500">
          Isi form di bawah ini untuk melaporkan kejadian insiden yang terjadi
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Incident Type */}
          <div className="space-y-2">
            <Label
              htmlFor="incident-type"
              className="text-sm font-medium text-slate-700"
            >
              Jenis Insiden <span className="text-red-500">*</span>
            </Label>
            <Select
              value={incidentType}
              onValueChange={(value) => setIncidentType(value as IncidentType)}
            >
              <SelectTrigger id="incident-type">
                <SelectValue placeholder="Pilih jenis insiden" />
              </SelectTrigger>
              <SelectContent>
                {incidentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chronology */}
          <div className="space-y-2">
            <Label
              htmlFor="chronology"
              className="text-sm font-medium text-slate-700"
            >
              Kronologi Kejadian <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="chronology"
              placeholder="Jelaskan secara detail apa yang terjadi, kapan, dan dimana..."
              value={chronology}
              onChange={(e) => setChronology(e.target.value)}
              rows={5}
              className="resize-none"
              required
            />
          </div>

          {/* People Involved - Only show if tripId is provided and passengers exist */}
          {tripId && passengers.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Users className="h-4 w-4" />
                Orang yang Terlibat (Opsional)
              </Label>
              <Card className="border-slate-200 bg-slate-50">
                <CardContent className="p-3">
                  <p className="mb-3 text-xs text-slate-600">
                    Pilih penumpang yang terlibat dalam insiden ini
                  </p>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {passengers.map((passenger) => (
                      <div
                        key={passenger.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                      >
                        <Checkbox
                          id={`passenger-${passenger.id}`}
                          checked={involvedPassengerIds.includes(passenger.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setInvolvedPassengerIds((prev) => [
                                ...prev,
                                passenger.id,
                              ]);
                            } else {
                              setInvolvedPassengerIds((prev) =>
                                prev.filter((id) => id !== passenger.id)
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={`passenger-${passenger.id}`}
                          className="flex-1 cursor-pointer text-sm font-medium text-slate-700"
                        >
                          {passenger.full_name}
                          {passenger.passenger_type && (
                            <span className="ml-2 text-xs text-slate-500">
                              ({passenger.passenger_type})
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {involvedPassengerIds.length > 0 && (
                    <p className="mt-2 text-xs text-slate-600">
                      {involvedPassengerIds.length} penumpang dipilih
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Injury Details - Only show if incidentType is 'injury' */}
          {incidentType === 'injury' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <AlertCircle className="h-4 w-4" />
                  Detail Cedera (ISO 21101)
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (
                      involvedPassengerIds.length === 0 &&
                      passengers.length === 0
                    ) {
                      setMessage({
                        type: 'error',
                        text: 'Pilih orang yang terlibat terlebih dahulu',
                      });
                      return;
                    }
                    // Add new injury - default to first selected passenger or first passenger
                    const defaultPersonId =
                      involvedPassengerIds[0] || passengers[0]?.id || '';
                    if (!defaultPersonId) {
                      setMessage({
                        type: 'error',
                        text: 'Tidak ada penumpang tersedia',
                      });
                      return;
                    }
                    setInjuries((prev) => [
                      ...prev,
                      {
                        person_id: defaultPersonId,
                        person_type: 'passenger',
                        body_part: 'other',
                        severity: 'minor',
                        first_aid_given: false,
                        hospital_required: false,
                      },
                    ]);
                  }}
                  className="text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Tambah Cedera
                </Button>
              </div>
              {injuries.length === 0 ? (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-3">
                    <p className="text-xs text-amber-700">
                      Klik "Tambah Cedera" untuk menambahkan detail cedera
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {injuries.map((injury, index) => (
                    <Card key={index} className="border-slate-200">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-900">
                            Cedera #{index + 1}
                          </h4>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setInjuries((prev) =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Person */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-700">
                            Orang yang Cedera
                          </Label>
                          <Select
                            value={injury.person_id}
                            onValueChange={(value) => {
                              setInjuries((prev) =>
                                prev.map((inj, i) =>
                                  i === index
                                    ? { ...inj, person_id: value }
                                    : inj
                                )
                              );
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Pilih orang" />
                            </SelectTrigger>
                            <SelectContent>
                              {passengers.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Body Part */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-700">
                            Bagian Tubuh
                          </Label>
                          <Select
                            value={injury.body_part}
                            onValueChange={(value) => {
                              setInjuries((prev) =>
                                prev.map((inj, i) =>
                                  i === index
                                    ? {
                                        ...inj,
                                        body_part: value as Injury['body_part'],
                                      }
                                    : inj
                                )
                              );
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="head">Kepala</SelectItem>
                              <SelectItem value="torso">Badan</SelectItem>
                              <SelectItem value="arm">Lengan</SelectItem>
                              <SelectItem value="leg">Kaki</SelectItem>
                              <SelectItem value="other">Lainnya</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Severity */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-700">
                            Tingkat Keparahan
                          </Label>
                          <Select
                            value={injury.severity}
                            onValueChange={(value) => {
                              setInjuries((prev) =>
                                prev.map((inj, i) =>
                                  i === index
                                    ? {
                                        ...inj,
                                        severity: value as Injury['severity'],
                                      }
                                    : inj
                                )
                              );
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minor">Ringan</SelectItem>
                              <SelectItem value="moderate">Sedang</SelectItem>
                              <SelectItem value="severe">Berat</SelectItem>
                              <SelectItem value="critical">Kritis</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* First Aid */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`first-aid-${index}`}
                              checked={injury.first_aid_given}
                              onCheckedChange={(checked) => {
                                setInjuries((prev) =>
                                  prev.map((inj, i) =>
                                    i === index
                                      ? { ...inj, first_aid_given: !!checked }
                                      : inj
                                  )
                                );
                              }}
                            />
                            <Label
                              htmlFor={`first-aid-${index}`}
                              className="text-xs font-medium text-slate-700"
                            >
                              First Aid Diberikan
                            </Label>
                          </div>
                          {injury.first_aid_given && (
                            <Textarea
                              placeholder="Jelaskan tindakan first aid yang diberikan..."
                              value={injury.first_aid_description || ''}
                              onChange={(e) => {
                                setInjuries((prev) =>
                                  prev.map((inj, i) =>
                                    i === index
                                      ? {
                                          ...inj,
                                          first_aid_description: e.target.value,
                                        }
                                      : inj
                                  )
                                );
                              }}
                              rows={2}
                              className="text-xs"
                            />
                          )}
                        </div>

                        {/* Hospital */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`hospital-${index}`}
                              checked={injury.hospital_required}
                              onCheckedChange={(checked) => {
                                setInjuries((prev) =>
                                  prev.map((inj, i) =>
                                    i === index
                                      ? { ...inj, hospital_required: !!checked }
                                      : inj
                                  )
                                );
                              }}
                            />
                            <Label
                              htmlFor={`hospital-${index}`}
                              className="text-xs font-medium text-slate-700"
                            >
                              Perlu Perawatan Rumah Sakit
                            </Label>
                          </div>
                          {injury.hospital_required && (
                            <Input
                              placeholder="Nama rumah sakit..."
                              value={injury.hospital_name || ''}
                              onChange={(e) => {
                                setInjuries((prev) =>
                                  prev.map((inj, i) =>
                                    i === index
                                      ? {
                                          ...inj,
                                          hospital_name: e.target.value,
                                        }
                                      : inj
                                  )
                                );
                              }}
                              className="text-xs"
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Report Generator */}
          {chronology.trim() && (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-900">
                      AI Report Assistant
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateAiReport}
                    disabled={generatingAiReport}
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  >
                    {generatingAiReport ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Bot className="mr-2 h-3 w-3" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
                {aiReport && (
                  <div className="mt-3 space-y-2 rounded-lg border border-emerald-200 bg-white p-3">
                    <p className="text-xs font-semibold text-emerald-900">
                      AI Generated Report:
                    </p>
                    <div className="space-y-1 text-xs text-slate-700">
                      {aiReport.summary && (
                        <p>
                          <span className="font-medium">Summary:</span>{' '}
                          {aiReport.summary}
                        </p>
                      )}
                      {aiReport.what && (
                        <p>
                          <span className="font-medium">What:</span>{' '}
                          {aiReport.what}
                        </p>
                      )}
                      {aiReport.immediateActions &&
                        aiReport.immediateActions.length > 0 && (
                          <div>
                            <p className="font-medium">Immediate Actions:</p>
                            <ul className="ml-4 list-disc">
                              {aiReport.immediateActions.map((action, i) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Witnesses */}
          <div className="space-y-2">
            <Label
              htmlFor="witnesses"
              className="text-sm font-medium text-slate-700"
            >
              Saksi (opsional)
            </Label>
            <Input
              id="witnesses"
              placeholder="Nama dan kontak saksi jika ada"
              value={witnesses}
              onChange={(e) => setWitnesses(e.target.value)}
            />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Foto Pendukung (opsional, maks. 5 foto)
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="mr-2 h-4 w-4" />
              Pilih Foto
            </Button>

            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-20 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              className={cn(
                'flex items-start gap-2 rounded-lg p-3 text-sm',
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              )}
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{message.text}</p>
            </div>
          )}

          {/* Signature Section */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Tanda Tangan <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-slate-500">
              Tanda tangan untuk konfirmasi bahwa data yang diisi akurat
            </p>
            <SignaturePad
              value={signature}
              onChange={setSignature}
              label=""
              required
              showGPS={false}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={
              submitting || !incidentType || !chronology.trim() || !signature
            }
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Kirim Laporan
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
