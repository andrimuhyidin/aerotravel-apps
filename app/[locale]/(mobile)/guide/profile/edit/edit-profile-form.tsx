'use client';

/**
 * Edit Profile Form Component
 * Form untuk mengubah profil guide dengan validation
 */

import { Loader2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

type EditProfileFormProps = {
  locale: string;
  initialData: {
    name: string;
    phone: string;
    email: string;
  };
};

export function EditProfileForm({ locale, initialData }: EditProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData.name,
    phone: initialData.phone,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Anda harus login untuk mengubah profil');
        return;
      }

      // Update profile in users table
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError((err as Error).message || 'Gagal menyimpan perubahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {success && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          Profil berhasil diperbarui!
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-slate-700">
          Nama Lengkap
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="pl-9"
            placeholder="Masukkan nama lengkap"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
          No. Telepon
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="08xxxxxxxxxx"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={initialData.email}
          disabled
          className="bg-slate-50 text-slate-500"
        />
        <p className="text-xs text-slate-500">Email tidak dapat diubah</p>
      </div>

      <Button
        type="submit"
        className="w-full bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
        disabled={loading || success}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Menyimpan...
          </>
        ) : success ? (
          'Tersimpan!'
        ) : (
          'Simpan Perubahan'
        )}
      </Button>
    </form>
  );
}
