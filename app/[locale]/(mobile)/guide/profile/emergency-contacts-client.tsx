/**
 * Emergency Contacts Client Component
 * Manage emergency contacts for SOS auto-notify
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, User } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import queryKeys from '@/lib/queries/query-keys';

type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  priority: number;
  auto_notify: boolean;
  is_active: boolean;
};

type EmergencyContactsResponse = {
  contacts: EmergencyContact[];
};

export function EmergencyContactsClient() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'other' as 'spouse' | 'parent' | 'sibling' | 'friend' | 'other',
    phone: '',
    email: '',
    priority: 1,
    auto_notify: true,
  });

  const { data, isLoading } = useQuery<EmergencyContactsResponse>({
    queryKey: queryKeys.guide.emergencyContacts(),
    queryFn: async () => {
      const res = await fetch('/api/guide/emergency-contacts');
      if (!res.ok) throw new Error('Failed to fetch contacts');
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (contact: typeof formData) => {
      const res = await fetch('/api/guide/emergency-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });
      if (!res.ok) throw new Error('Failed to add contact');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.emergencyContacts() });
      setIsDialogOpen(false);
      setFormData({
        name: '',
        relationship: 'other',
        phone: '',
        email: '',
        priority: 1,
        auto_notify: true,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/guide/emergency-contacts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete contact');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.emergencyContacts() });
    },
  });

  const contacts = data?.contacts || [];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Kontak Darurat</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Kontak Darurat</DialogTitle>
                <DialogDescription>
                  Kontak ini akan otomatis menerima notifikasi saat Anda mengaktifkan SOS
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Nama</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nama lengkap"
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Hubungan</Label>
                  <Select
                    value={formData.relationship}
                    onValueChange={(value) =>
                      setFormData({ ...formData, relationship: value as typeof formData.relationship })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Pasangan</SelectItem>
                      <SelectItem value="parent">Orang Tua</SelectItem>
                      <SelectItem value="sibling">Saudara</SelectItem>
                      <SelectItem value="friend">Teman</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="081234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (opsional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_notify">Auto-notify saat SOS</Label>
                  <Switch
                    id="auto_notify"
                    checked={formData.auto_notify}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, auto_notify: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button
                  onClick={() => addMutation.mutate(formData)}
                  disabled={!formData.name || !formData.phone || addMutation.isPending}
                >
                  {addMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="py-4 text-center text-sm text-slate-500">Memuat...</div>
        ) : contacts.length === 0 ? (
          <div className="py-4 text-center text-sm text-slate-500">
            Belum ada kontak darurat. Tambahkan kontak untuk auto-notify saat SOS.
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <User className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{contact.name}</p>
                  <p className="text-xs text-slate-500">
                    {contact.relationship} • {contact.phone}
                  </p>
                  {contact.auto_notify && (
                    <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      Auto-notify
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteMutation.mutate(contact.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

