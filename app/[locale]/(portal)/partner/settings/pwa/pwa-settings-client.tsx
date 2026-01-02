/**
 * PWA Settings Client Component
 * Manage PWA installation, offline data, and notifications
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Cloud,
  Download,
  HardDrive,
  RefreshCw,
  Smartphone,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/partner';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import { cn } from '@/lib/utils';

type PwaSettingsClientProps = {
  locale: string;
};

type StorageEstimate = {
  usage: number;
  quota: number;
  usagePercentage: number;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function PwaSettingsClient({ locale }: PwaSettingsClientProps) {
  const { isInstalled, isStandalone, isIOS, isAndroid, promptInstall } = usePwaInstall();
  const { isOnline, isOfflineReady } = useOfflineStatus();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate | null>(null);
  const [swVersion, setSwVersion] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get storage estimate
  useEffect(() => {
    const getStorageEstimate = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          setStorageEstimate({
            usage: estimate.usage || 0,
            quota: estimate.quota || 0,
            usagePercentage:
              estimate.usage && estimate.quota
                ? (estimate.usage / estimate.quota) * 100
                : 0,
          });
        } catch {
          // Storage API not available
        }
      }
    };

    getStorageEstimate();
  }, []);

  // Get SW version
  useEffect(() => {
    const getSwVersion = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.active) {
          // For demo, use timestamp
          setSwVersion(new Date().toISOString().split('T')[0]);
        }
      }
    };

    getSwVersion();
  }, []);

  // Check push notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleTogglePush = async () => {
    if (!('Notification' in window)) {
      toast.error('Browser tidak mendukung notifikasi');
      return;
    }

    if (Notification.permission === 'denied') {
      toast.error('Notifikasi diblokir. Silakan aktifkan di pengaturan browser.');
      return;
    }

    if (!pushEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        toast.success('Notifikasi diaktifkan');
      } else {
        toast.error('Izin notifikasi ditolak');
      }
    } else {
      // Can't revoke permission via JS, just inform user
      toast.info('Nonaktifkan notifikasi di pengaturan browser');
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        toast.success('Cache berhasil dihapus');
        
        // Refresh storage estimate
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          setStorageEstimate({
            usage: estimate.usage || 0,
            quota: estimate.quota || 0,
            usagePercentage:
              estimate.usage && estimate.quota
                ? (estimate.usage / estimate.quota) * 100
                : 0,
          });
        }
      }
    } catch {
      toast.error('Gagal menghapus cache');
    } finally {
      setIsClearing(false);
    }
  };

  const handleUpdateApp = async () => {
    setIsUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          toast.success('Aplikasi akan diperbarui saat reload');
          // Reload after short delay
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    } catch {
      toast.error('Gagal memperbarui aplikasi');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader
        title="Pengaturan PWA"
        description="Kelola aplikasi dan penyimpanan offline"
      />

      <div className="space-y-4 px-4">
        {/* Installation Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-5 w-5" />
              Status Instalasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status Aplikasi</p>
                <p className="text-sm text-muted-foreground">
                  {isStandalone
                    ? 'Berjalan sebagai aplikasi standalone'
                    : 'Berjalan di browser'}
                </p>
              </div>
              <Badge variant={isInstalled ? 'default' : 'outline'}>
                {isInstalled ? 'Terinstall' : 'Belum Install'}
              </Badge>
            </div>

            {!isInstalled && !isStandalone && (
              <Button onClick={promptInstall} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Install Aplikasi
              </Button>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Platform</p>
                <p className="font-medium">
                  {isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Versi SW</p>
                <p className="font-medium">{swVersion || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
              Status Koneksi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Koneksi Internet</p>
                <p className="text-sm text-muted-foreground">
                  {isOnline ? 'Terhubung ke internet' : 'Tidak ada koneksi'}
                </p>
              </div>
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mode Offline</p>
                <p className="text-sm text-muted-foreground">
                  Akses fitur dasar tanpa internet
                </p>
              </div>
              <Badge variant={isOfflineReady ? 'default' : 'outline'}>
                {isOfflineReady ? 'Siap' : 'Belum Siap'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5" />
              Notifikasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Terima notifikasi booking & update
                </p>
              </div>
              <Switch checked={pushEnabled} onCheckedChange={handleTogglePush} />
            </div>
          </CardContent>
        </Card>

        {/* Data & Storage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-5 w-5" />
              Penyimpanan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {storageEstimate && (
              <>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Penggunaan Storage</span>
                    <span>
                      {formatBytes(storageEstimate.usage)} /{' '}
                      {formatBytes(storageEstimate.quota)}
                    </span>
                  </div>
                  <Progress value={storageEstimate.usagePercentage} className="h-2" />
                </div>
                <Separator />
              </>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sinkronisasi Otomatis</p>
                <p className="text-sm text-muted-foreground">
                  Sync data saat online
                </p>
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClearCache}
                disabled={isClearing}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isClearing ? 'Menghapus...' : 'Hapus Cache'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleUpdateApp}
                disabled={isUpdating}
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', isUpdating && 'animate-spin')} />
                {isUpdating ? 'Updating...' : 'Update App'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Alert>
          <Cloud className="h-4 w-4" />
          <AlertTitle>Tentang PWA</AlertTitle>
          <AlertDescription>
            Progressive Web App memungkinkan Anda menggunakan Aero Partner seperti aplikasi
            native. Install untuk akses lebih cepat dan fitur offline.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

