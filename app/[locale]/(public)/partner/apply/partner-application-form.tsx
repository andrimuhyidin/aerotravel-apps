/**
 * Partner Application Form
 * Client component for partner (mitra) role application
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, FileText, Loader2, MapPin, Phone, Upload, X, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { ControllerRenderProps } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { useApplyRole } from '@/hooks/use-roles';
import { logger } from '@/lib/utils/logger';

const partnerApplicationSchema = z.object({
  companyName: z.string().min(3, 'Nama perusahaan minimal 3 karakter'),
  companyAddress: z.string().min(10, 'Alamat perusahaan minimal 10 karakter'),
  npwp: z.string().min(15, 'NPWP tidak valid').max(15, 'NPWP tidak valid'),
  phone: z.string().min(10, 'Nomor telepon tidak valid'),
  contactPerson: z.string().min(3, 'Nama kontak minimal 3 karakter'),
  siupNumber: z.string().min(1, 'Nomor SIUP wajib diisi').optional(),
  siupDocument: z.instanceof(File).optional().or(z.literal('')),
  bankName: z.string().min(1, 'Nama bank wajib diisi').optional(),
  bankAccountNumber: z.string().min(1, 'Nomor rekening wajib diisi').optional(),
  bankAccountName: z.string().min(1, 'Nama pemilik rekening wajib diisi').optional(),
  message: z.string().optional(),
});

type PartnerApplicationFormData = z.infer<typeof partnerApplicationSchema>;

type PartnerApplicationFormProps = {
  locale: string;
};

export function PartnerApplicationForm({
  locale,
}: PartnerApplicationFormProps) {
  const router = useRouter();
  const applyRole = useApplyRole();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PartnerApplicationFormData>({
    resolver: zodResolver(partnerApplicationSchema),
    defaultValues: {
      companyName: '',
      companyAddress: '',
      npwp: '',
      phone: '',
      contactPerson: '',
      siupNumber: '',
      siupDocument: undefined,
      bankName: '',
      bankAccountNumber: '',
      bankAccountName: '',
      message: '',
    },
  });

  const [siupDocumentPreview, setSiupDocumentPreview] = useState<string | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [processingOCR, setProcessingOCR] = useState(false);
  const [ocrData, setOcrData] = useState<{ siupNumber?: string; confidence?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      form.setValue('siupDocument', undefined);
      setSiupDocumentPreview(null);
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('File harus berupa PDF, JPEG, atau PNG');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }

    form.setValue('siupDocument', file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSiupDocumentPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSiupDocumentPreview(null);
    }

    // Auto-process OCR for SIUP documents
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleOCRScan(file);
    }
  };

  const handleOCRScan = async (file: File) => {
    setProcessingOCR(true);
    setOcrData(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'siup');

      const ocrRes = await fetch('/api/partner/documents/ocr', {
        method: 'POST',
        body: formData,
      });

      if (ocrRes.ok) {
        const ocrResult = await ocrRes.json();
        if (ocrResult.success && ocrResult.data) {
          const extractedData = ocrResult.data.extractedData || {};
          const siupNumber = extractedData.nomor_siup || extractedData.siup_number;
          
          if (siupNumber) {
            setOcrData({
              siupNumber: String(siupNumber),
              confidence: ocrResult.confidence || 0,
            });
            // Auto-fill SIUP number if field is empty
            if (!form.getValues('siupNumber')) {
              form.setValue('siupNumber', String(siupNumber));
              toast.success(`Nomor SIUP berhasil diekstrak (confidence: ${ocrResult.confidence || 0}%)`);
            } else {
              toast.info(`Nomor SIUP terdeteksi: ${siupNumber} (confidence: ${ocrResult.confidence || 0}%)`);
            }
          } else {
            toast.warning('Tidak dapat mengekstrak nomor SIUP dari dokumen. Silakan isi manual.');
          }
        }
      } else {
        // OCR failed but don't block user
        logger.warn('OCR processing failed, user can fill manually');
      }
    } catch (error) {
      logger.error('Failed to process OCR', error);
      // Don't show error to user, they can fill manually
    } finally {
      setProcessingOCR(false);
    }
  };

  const onSubmit = async (data: PartnerApplicationFormData) => {
    setIsSubmitting(true);

    try {
      let siupDocumentUrl: string | null = null;
      let legalDocuments: string[] = [];

      // Upload SIUP document if provided
      if (data.siupDocument && data.siupDocument instanceof File) {
        setUploadingDocument(true);
        try {
          const formData = new FormData();
          formData.append('file', data.siupDocument);
          formData.append('documentType', 'siup');

          const uploadRes = await fetch('/api/partner/documents/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            const error = await uploadRes.json();
            throw new Error(error.error || 'Failed to upload document');
          }

          const uploadData = await uploadRes.json();
          siupDocumentUrl = uploadData.url;

          // Create partner_legal_documents entry and get ID
          try {
            const docRes = await fetch('/api/partner/profile/documents', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                documentType: 'siup',
                documentUrl: uploadData.url,
                documentNumber: data.siupNumber || ocrData?.siupNumber || null,
                fileName: data.siupDocument.name,
                fileSize: data.siupDocument.size,
                mimeType: data.siupDocument.type,
                ocrData: ocrData ? { nomor_siup: ocrData.siupNumber } : {},
                ocrConfidence: ocrData?.confidence || null,
              }),
            });

            if (docRes.ok) {
              const docData = await docRes.json();
              if (docData.document?.id) {
                legalDocuments.push(docData.document.id);
              }
            } else {
              logger.warn('Failed to create legal document entry, continuing with URL only');
            }
          } catch (docError) {
            logger.error('Failed to create legal document entry', docError);
            // Continue anyway, URL is stored in company_data
          }
        } catch (error) {
          logger.error('Failed to upload SIUP document', error);
          toast.error('Gagal upload dokumen SIUP. Silakan coba lagi.');
          setIsSubmitting(false);
          setUploadingDocument(false);
          return;
        } finally {
          setUploadingDocument(false);
        }
      }

      // Prepare company data
      const companyData = {
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        npwp: data.npwp,
        phone: data.phone,
        contactPerson: data.contactPerson,
        siupNumber: data.siupNumber || '',
        siupDocumentUrl: siupDocumentUrl,
        bankName: data.bankName || '',
        bankAccountNumber: data.bankAccountNumber || '',
        bankAccountName: data.bankAccountName || '',
      };

      // Apply for mitra role with enhanced data
      await applyRole.mutateAsync({
        role: 'mitra',
        message: `Perusahaan: ${data.companyName}\nAlamat: ${data.companyAddress}\nNPWP: ${data.npwp}\nPhone: ${data.phone}\nKontak: ${data.contactPerson}\nSIUP: ${data.siupNumber || 'Tidak ada'}\n${data.message ? `Pesan: ${data.message}` : ''}`,
        companyData,
        legalDocuments,
      });

      // Show success message
      toast.success(
        'Aplikasi berhasil dikirim! Tim kami akan menghubungi Anda untuk proses selanjutnya.'
      );

      // Redirect to mitra page after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/partner/dashboard`);
      }, 2000);
    } catch (_error) {
      // Error is handled by the hook
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulir Aplikasi Mitra</CardTitle>
        <CardDescription>
          Lengkapi informasi perusahaan di bawah ini untuk mendaftar sebagai
          mitra B2B
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  PartnerApplicationFormData,
                  'companyName'
                >;
              }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Nama Perusahaan
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="PT. Contoh Travel"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyAddress"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  PartnerApplicationFormData,
                  'companyAddress'
                >;
              }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Alamat Perusahaan
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="npwp"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  PartnerApplicationFormData,
                  'npwp'
                >;
              }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    NPWP
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="12.345.678.9-012.345"
                      maxLength={15}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>NPWP perusahaan (15 digit)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  PartnerApplicationFormData,
                  'phone'
                >;
              }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Nomor Telepon
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="081234567890"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Informasi SIUP</h3>
              
              <FormField
                control={form.control}
                name="siupNumber"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    PartnerApplicationFormData,
                    'siupNumber'
                  >;
                }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Nomor SIUP
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Nomor SIUP perusahaan"
                          {...field}
                          disabled={isSubmitting}
                          className={ocrData?.siupNumber ? 'border-green-500' : ''}
                        />
                        {processingOCR && (
                          <div className="absolute right-2 top-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        {ocrData?.siupNumber && !processingOCR && (
                          <div className="absolute right-2 top-2">
                            <span className="text-xs text-green-600">✓ OCR</span>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    {ocrData?.siupNumber && (
                      <FormDescription className="text-green-600">
                        Nomor SIUP berhasil diekstrak dari dokumen (confidence: {ocrData.confidence}%)
                      </FormDescription>
                    )}
                    {!ocrData?.siupNumber && (
                      <FormDescription>
                        Nomor Surat Izin Usaha Perdagangan
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Dokumen SIUP
                </FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleFileChange(file);
                      }}
                      disabled={isSubmitting || uploadingDocument}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting || uploadingDocument}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {siupDocumentPreview || form.watch('siupDocument') ? 'Ganti File' : 'Upload Dokumen SIUP'}
                    </Button>
                    {siupDocumentPreview && (
                      <div className="relative rounded-lg border p-2">
                        <img
                          src={siupDocumentPreview}
                          alt="SIUP preview"
                          className="max-h-32 w-full object-contain"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2"
                          onClick={() => {
                            handleFileChange(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {form.watch('siupDocument') && !siupDocumentPreview && (
                      <div className="flex items-center justify-between rounded-lg border p-2">
                        <span className="text-sm">
                          {(form.watch('siupDocument') as File)?.name || 'File terpilih'}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            handleFileChange(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Upload dokumen SIUP dalam format PDF, JPEG, atau PNG (maks. 10MB)
                </FormDescription>
              </FormItem>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Informasi Rekening Bank</h3>
              
              <FormField
                control={form.control}
                name="bankName"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    PartnerApplicationFormData,
                    'bankName'
                  >;
                }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Nama Bank
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Bank Mandiri, BCA, BRI"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankAccountNumber"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    PartnerApplicationFormData,
                    'bankAccountNumber'
                  >;
                }) => (
                  <FormItem>
                    <FormLabel>Nomor Rekening</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nomor rekening bank"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankAccountName"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    PartnerApplicationFormData,
                    'bankAccountName'
                  >;
                }) => (
                  <FormItem>
                    <FormLabel>Nama Pemilik Rekening</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nama sesuai rekening bank"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Nama harus sesuai dengan nama di rekening bank
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactPerson"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  PartnerApplicationFormData,
                  'contactPerson'
                >;
              }) => (
                <FormItem>
                  <FormLabel>Nama Kontak Person</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nama lengkap kontak person"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Nama orang yang dapat dihubungi untuk keperluan kerjasama
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  PartnerApplicationFormData,
                  'message'
                >;
              }) => (
                <FormItem>
                  <FormLabel>Pesan Tambahan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Pesan atau informasi tambahan tentang perusahaan Anda"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  'Kirim Aplikasi'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Batal
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
