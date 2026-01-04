/**
 * Saved Searches Component
 * Save, load, and delete search filter presets
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logger } from '@/lib/utils/logger';
import { Bookmark, BookmarkCheck, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type SearchPreset = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type SavedSearchesProps = {
  currentFilters: Record<string, unknown>;
  onLoadPreset: (filters: Record<string, unknown>) => void;
};

export function SavedSearches({
  currentFilters,
  onLoadPreset,
}: SavedSearchesProps) {
  const [presets, setPresets] = useState<SearchPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/partner/search-presets');

      if (!response.ok) {
        throw new Error('Failed to load presets');
      }

      const data = (await response.json()) as { presets: SearchPreset[] };
      setPresets(data.presets || []);
    } catch (error) {
      logger.error('Failed to load search presets', error, {});
      toast.error('Gagal memuat preset pencarian');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!presetName.trim()) {
      toast.error('Nama preset tidak boleh kosong');
      return;
    }

    try {
      const response = await fetch('/api/partner/search-presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: presetName.trim(),
          filters: currentFilters,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save preset');
      }

      toast.success('Preset berhasil disimpan');
      setSaveDialogOpen(false);
      setPresetName('');
      loadPresets();
    } catch (error) {
      logger.error('Failed to save search preset', error, {});
      toast.error('Gagal menyimpan preset');
    }
  };

  const handleLoad = (preset: SearchPreset) => {
    onLoadPreset(preset.filters);
    toast.success(`Preset "${preset.name}" dimuat`);
  };

  const handleDelete = async (presetId: string, presetName: string) => {
    if (!confirm(`Hapus preset "${presetName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/partner/search-presets/${presetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete preset');
      }

      toast.success('Preset berhasil dihapus');
      loadPresets();
    } catch (error) {
      logger.error('Failed to delete search preset', error, {});
      toast.error('Gagal menghapus preset');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Load Preset Dropdown */}
      {presets.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <BookmarkCheck className="h-4 w-4 mr-2" />
              Load Preset ({presets.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Saved Searches</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {presets.map((preset) => (
              <div key={preset.id} className="flex items-center justify-between group">
                <DropdownMenuItem
                  onClick={() => handleLoad(preset)}
                  className="flex-1 cursor-pointer"
                >
                  {preset.name}
                </DropdownMenuItem>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(preset.id, preset.name);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Save Preset Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            Save Search
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simpan Pencarian</DialogTitle>
            <DialogDescription>
              Simpan filter pencarian saat ini sebagai preset untuk digunakan
              kembali nanti.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Nama Preset</Label>
              <Input
                id="preset-name"
                placeholder="Misalnya: Paket Murah Bali"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSaveDialogOpen(false);
                setPresetName('');
              }}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={loading || !presetName.trim()}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

