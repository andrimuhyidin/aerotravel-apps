'use client';

/**
 * Map Download Client Component
 * UI untuk download map regions untuk offline use
 */

import { Download, Loader2, Map, Trash2, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { downloadMapRegion } from '@/lib/maps/tile-downloader';
import { getStorageUsage, clearRegionTiles, getCachedRegions } from '@/lib/maps/tile-cache';
import { logger } from '@/lib/utils/logger';

type MapRegion = {
  id: string;
  name: string;
  description: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoomLevels: number[];
  estimatedTiles?: number;
  estimatedSizeMB?: number;
};

type DownloadStatus = {
  regionId: string;
  status: 'idle' | 'downloading' | 'downloaded' | 'error';
  progress: number; // 0-100
  tilesDownloaded: number;
  totalTiles: number;
  error?: string;
};

// Predefined regions
const MAP_REGIONS: MapRegion[] = [
  {
    id: 'lampung',
    name: 'Lampung',
    description: 'Area perairan Lampung dan sekitarnya',
    bounds: {
      north: -5.0,
      south: -6.0,
      east: 106.0,
      west: 104.0,
    },
    zoomLevels: [10, 11, 12, 13, 14],
  },
  {
    id: 'pahawang',
    name: 'Pahawang',
    description: 'Pulau Pahawang dan sekitarnya',
    bounds: {
      north: -5.6,
      south: -5.8,
      east: 105.2,
      west: 105.0,
    },
    zoomLevels: [12, 13, 14, 15],
  },
  {
    id: 'krakatoa',
    name: 'Krakatoa',
    description: 'Area Krakatoa dan sekitarnya',
    bounds: {
      north: -6.0,
      south: -6.2,
      east: 105.4,
      west: 105.2,
    },
    zoomLevels: [12, 13, 14, 15],
  },
];

export function MapDownloadClient() {
  const [downloadStatuses, setDownloadStatuses] = useState<Record<string, DownloadStatus>>({});
  const [storageUsage, setStorageUsage] = useState<{ used: number; quota: number } | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load storage usage
    loadStorageUsage();

    // Check existing downloads from IndexedDB (optional enhancement)
    checkDownloadedRegions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadStorageUsage = async () => {
    try {
      const usage = await getStorageUsage();
      setStorageUsage(usage);
    } catch (error) {
      logger.error('Failed to load storage usage', error);
    }
  };

  const checkDownloadedRegions = async () => {
    try {
      // Check which regions are already downloaded
      const cachedRegions = await getCachedRegions();
      const statuses: Record<string, DownloadStatus> = {};
      
      MAP_REGIONS.forEach((region) => {
        const isDownloaded = cachedRegions.includes(region.id);
        statuses[region.id] = {
          regionId: region.id,
          status: isDownloaded ? 'downloaded' : 'idle',
          progress: isDownloaded ? 100 : 0,
          tilesDownloaded: 0,
          totalTiles: 0,
        };
      });
      
      setDownloadStatuses(statuses);
    } catch (error) {
      logger.error('Failed to check downloaded regions', error);
      // Initialize all as 'idle' if check fails
      const statuses: Record<string, DownloadStatus> = {};
      MAP_REGIONS.forEach((region) => {
        statuses[region.id] = {
          regionId: region.id,
          status: 'idle',
          progress: 0,
          tilesDownloaded: 0,
          totalTiles: 0,
        };
      });
      setDownloadStatuses(statuses);
    }
  };

  const handleDownload = async (region: MapRegion) => {
    if (!isOnline) {
      toast.error('Koneksi internet diperlukan untuk download peta');
      return;
    }

    // Update status to downloading
    setDownloadStatuses((prev) => ({
      ...prev,
      [region.id]: {
        regionId: region.id,
        status: 'downloading',
        progress: 0,
        tilesDownloaded: 0,
        totalTiles: region.estimatedTiles || 0,
      },
    }));

    try {
      // First, estimate tiles and size
      const estimateResponse = await fetch('/api/guide/maps/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: region.id,
          bounds: region.bounds,
          zoomLevels: region.zoomLevels,
        }),
      });

      if (!estimateResponse.ok) {
        throw new Error('Failed to get download estimate');
      }

      const estimateData = await estimateResponse.json();
      const totalTiles = estimateData.estimatedTiles || 0;

      // Update with estimated tiles
      setDownloadStatuses((prev) => ({
        ...prev,
        [region.id]: {
          ...prev[region.id]!,
          totalTiles,
        },
      }));

      // Start downloading tiles
      await downloadMapRegion(
        region.bounds,
        region.zoomLevels,
        region.id,
        (progress) => {
          setDownloadStatuses((prev) => ({
            ...prev,
            [region.id]: {
              ...prev[region.id]!,
              progress: progress.percentage,
              tilesDownloaded: progress.downloaded,
              totalTiles: progress.total,
            },
          }));
        }
      );

      // Download complete
      setDownloadStatuses((prev) => ({
        ...prev,
        [region.id]: {
          ...prev[region.id]!,
          status: 'downloaded',
          progress: 100,
        },
      }));

      toast.success(`Peta ${region.name} berhasil di-download`);
      await loadStorageUsage(); // Refresh storage usage
    } catch (error) {
      logger.error('Failed to download map region', error, { regionId: region.id });
      const errorMessage = error instanceof Error ? error.message : 'Gagal download peta';
      
      setDownloadStatuses((prev) => ({
        ...prev,
        [region.id]: {
          ...prev[region.id]!,
          status: 'error',
          error: errorMessage,
        },
      }));

      toast.error(`Gagal download peta ${region.name}: ${errorMessage}`);
    }
  };

  const handleDelete = async (regionId: string) => {
    try {
      await clearRegionTiles(regionId);
      toast.success('Peta berhasil dihapus');
      
      setDownloadStatuses((prev) => ({
        ...prev,
        [regionId]: {
          ...prev[regionId]!,
          status: 'idle',
          progress: 0,
          tilesDownloaded: 0,
          totalTiles: 0,
        },
      }));

      await loadStorageUsage();
    } catch (error) {
      logger.error('Failed to delete region tiles', error, { regionId });
      toast.error('Gagal menghapus peta');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Storage Usage */}
      {storageUsage && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Penyimpanan Map</p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.quota)} digunakan
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-emerald-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </div>
            <Progress 
              value={(storageUsage.used / storageUsage.quota) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      )}

      {/* Region List */}
      {MAP_REGIONS.map((region) => {
        const status = downloadStatuses[region.id];
        const isDownloading = status?.status === 'downloading';
        const isDownloaded = status?.status === 'downloaded';
        const hasError = status?.status === 'error';

        return (
          <Card key={region.id} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Map className="h-5 w-5 text-slate-600" />
                    {region.name}
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">{region.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Download Info */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>
                  {status?.totalTiles ? `${status.totalTiles.toLocaleString()} tiles` : 'Estimating...'}
                </span>
                <span>
                  {status?.totalTiles 
                    ? `~${Math.round((status.totalTiles * 20) / 1024)} MB` 
                    : ''}
                </span>
              </div>

              {/* Progress */}
              {isDownloading && status && (
                <div className="space-y-1">
                  <Progress value={status.progress} />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {status.tilesDownloaded.toLocaleString()} / {status.totalTiles.toLocaleString()} tiles
                    </span>
                    <span>{Math.round(status.progress)}%</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {hasError && status?.error && (
                <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700">
                  {status.error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {isDownloaded ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled
                    >
                      <Map className="mr-2 h-4 w-4" />
                      Terunduh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(region.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownload(region)}
                    disabled={isDownloading || !isOnline}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengunduh...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Unduh Peta
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Info */}
      <Card className="border-0 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-xs text-blue-900">
            <strong>Tips:</strong> Unduh peta sebelum berangkat untuk penggunaan offline. 
            Peta akan otomatis digunakan saat tidak ada koneksi internet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

