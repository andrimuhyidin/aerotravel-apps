'use client';

/**
 * GPS Troubleshooting Component
 * Diagnostic info and troubleshooting guide for GPS issues
 */

import { AlertTriangle, CheckCircle, Loader2, MapPin, Settings, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentPosition } from '@/lib/guide';
import { cn } from '@/lib/utils';
import { checkGeolocationPermission, getPermissionStatusInfo } from '@/lib/utils/permissions';

type GPSDiagnostics = {
  geolocationSupported: boolean;
  permissionStatus: PermissionState;
  lastTestSuccess: boolean;
  lastTestError?: string;
  testRunning: boolean;
};

export function GPSTroubleshooting() {
  const [diagnostics, setDiagnostics] = useState<GPSDiagnostics>({
    geolocationSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    permissionStatus: 'prompt',
    lastTestSuccess: false,
    testRunning: false,
  });
  const [isOpen, setIsOpen] = useState(false);

  const runDiagnostics = async () => {
    setDiagnostics((prev) => ({ ...prev, testRunning: true, lastTestError: undefined }));

    try {
      // Check permission
      const permissionStatus = await checkGeolocationPermission();
      
      // Test GPS
      const position = await getCurrentPosition();
      
      setDiagnostics({
        geolocationSupported: true,
        permissionStatus,
        lastTestSuccess: true,
        testRunning: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDiagnostics((prev) => ({
        ...prev,
        lastTestSuccess: false,
        lastTestError: errorMessage,
        testRunning: false,
      }));
    }
  };

  const permissionInfo = getPermissionStatusInfo(diagnostics.permissionStatus);

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsOpen(true);
          void runDiagnostics();
        }}
        className="text-xs"
      >
        <Settings className="mr-2 h-4 w-4" />
        Troubleshoot GPS
      </Button>
    );
  }

  return (
    <Card className="border-0 shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Settings className="h-5 w-5 text-slate-600" />
            GPS Troubleshooting
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Diagnostic Results */}
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <div>
              <p className="text-xs font-medium text-slate-600">Geolocation Support</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {diagnostics.geolocationSupported ? 'Didukung' : 'Tidak Didukung'}
              </p>
            </div>
            {diagnostics.geolocationSupported ? (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            ) : (
              <X className="h-5 w-5 text-red-600" />
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <div>
              <p className="text-xs font-medium text-slate-600">Status Izin</p>
              <p className={cn(
                'mt-0.5 text-sm font-semibold',
                permissionInfo.color === 'emerald' && 'text-emerald-900',
                permissionInfo.color === 'red' && 'text-red-900',
                permissionInfo.color === 'amber' && 'text-amber-900',
              )}>
                {permissionInfo.label}
              </p>
            </div>
            {permissionInfo.icon === 'check' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
            {permissionInfo.icon === 'x' && <X className="h-5 w-5 text-red-600" />}
            {permissionInfo.icon === 'alert' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
          </div>

          {diagnostics.lastTestError && (
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-xs font-medium text-red-900">Test Error</p>
              <p className="mt-1 text-sm text-red-700">{diagnostics.lastTestError}</p>
            </div>
          )}
        </div>

        {/* Test GPS Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={runDiagnostics}
          disabled={diagnostics.testRunning || !diagnostics.geolocationSupported}
        >
          {diagnostics.testRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing GPS...
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Test GPS
            </>
          )}
        </Button>

        {/* Troubleshooting Steps */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">Langkah Troubleshooting:</p>
          <ol className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-2">
              <span className="flex-shrink-0 font-semibold text-slate-600">1.</span>
              <span>Pastikan GPS perangkat sudah aktif di pengaturan sistem</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 font-semibold text-slate-600">2.</span>
              <span>Berikan izin lokasi ke browser (pilih &quot;Izinkan semua waktu&quot; untuk PWA)</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 font-semibold text-slate-600">3.</span>
              <span>Pindah ke area terbuka (tidak di dalam gedung) untuk akurasi GPS lebih baik</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 font-semibold text-slate-600">4.</span>
              <span>Pastikan koneksi internet stabil (untuk akurasi tinggi)</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 font-semibold text-slate-600">5.</span>
              <span>Refresh halaman jika GPS masih tidak bekerja</span>
            </li>
          </ol>
        </div>

        {diagnostics.permissionStatus === 'denied' && (
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-900">Cara Aktifkan Izin:</p>
            <ul className="mt-2 space-y-1 text-xs text-amber-800">
              <li>• Chrome/Edge: Settings → Privacy → Site Settings → Location</li>
              <li>• Safari: Preferences → Websites → Location</li>
              <li>• Firefox: Options → Privacy → Permissions → Location</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
