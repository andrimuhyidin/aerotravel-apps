/**
 * Medical Info Client Component
 * Manage medical information for emergency responders
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, AlertCircle, Heart, Shield } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import queryKeys from '@/lib/queries/query-keys';

type MedicalInfo = {
  id: string;
  blood_type: string | null;
  allergies: string[];
  medical_conditions: string[];
  current_medications: string[];
  emergency_notes: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
};

type MedicalInfoResponse = {
  medicalInfo: MedicalInfo | null;
};

export function MedicalInfoClient() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [allergyInput, setAllergyInput] = useState('');
  const [, setConditionInput] = useState('');
  const [, setMedicationInput] = useState('');

  const { data, isLoading } = useQuery<MedicalInfoResponse>({
    queryKey: queryKeys.guide.medicalInfo(),
    queryFn: async () => {
      const res = await fetch('/api/guide/medical-info');
      if (!res.ok) throw new Error('Failed to fetch medical info');
      return res.json();
    },
  });

  const medicalInfo = data?.medicalInfo;

  const updateMutation = useMutation({
    mutationFn: async (info: Partial<MedicalInfo>) => {
      const res = await fetch('/api/guide/medical-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      });
      if (!res.ok) throw new Error('Failed to update medical info');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.medicalInfo() });
      setIsDialogOpen(false);
    },
  });

  const handleAddAllergy = () => {
    if (allergyInput.trim()) {
      const current = medicalInfo?.allergies || [];
      updateMutation.mutate({
        allergies: [...current, allergyInput.trim()],
      });
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    const current = medicalInfo?.allergies || [];
    updateMutation.mutate({
      allergies: current.filter((_, i) => i !== index),
    });
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-blue-600" />
            Info Medis
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Info Medis</DialogTitle>
                <DialogDescription>
                  Informasi ini akan digunakan oleh tim medis dalam keadaan darurat
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="blood_type">Golongan Darah</Label>
                  <Select
                    value={medicalInfo?.blood_type || ''}
                    onValueChange={(value) =>
                      updateMutation.mutate({ blood_type: value || null })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih golongan darah" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Alergi</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      placeholder="Tambah alergi"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAllergy();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddAllergy} size="sm">
                      Tambah
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(medicalInfo?.allergies || []).map((allergy, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                      >
                        {allergy}
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergy(i)}
                          className="hover:text-red-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="emergency_notes">Catatan Darurat</Label>
                  <Textarea
                    id="emergency_notes"
                    value={medicalInfo?.emergency_notes || ''}
                    onChange={(e) =>
                      updateMutation.mutate({ emergency_notes: e.target.value || null })
                    }
                    placeholder="Info penting untuk tim medis (alergi obat, kondisi khusus, dll)"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="insurance_provider">Asuransi</Label>
                  <Input
                    id="insurance_provider"
                    value={medicalInfo?.insurance_provider || ''}
                    onChange={(e) =>
                      updateMutation.mutate({ insurance_provider: e.target.value || null })
                    }
                    placeholder="Nama provider asuransi"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Tutup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center text-sm text-slate-500">Memuat...</div>
        ) : !medicalInfo ? (
          <div className="py-4 text-center text-sm text-slate-500">
            Belum ada info medis. Klik Edit untuk menambahkan.
          </div>
        ) : (
          <div className="space-y-3">
            {medicalInfo.blood_type && (
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm text-slate-600">
                  Golongan Darah: <strong>{medicalInfo.blood_type}</strong>
                </span>
              </div>
            )}
            {medicalInfo.allergies && medicalInfo.allergies.length > 0 && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">Alergi:</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {medicalInfo.allergies.map((allergy, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {medicalInfo.emergency_notes && (
              <div className="flex items-start gap-2">
                <Activity className="h-4 w-4 text-blue-500 mt-0.5" />
                <p className="text-sm text-slate-600">{medicalInfo.emergency_notes}</p>
              </div>
            )}
            {medicalInfo.insurance_provider && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-slate-600">
                  Asuransi: <strong>{medicalInfo.insurance_provider}</strong>
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

