/**
 * Video Briefing Player Component
 * Play safety briefing videos with offline support
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logger } from '@/lib/utils/logger';
import queryKeys from '@/lib/queries/query-keys';

type VideoBriefingPlayerProps = {
  tripId: string;
  language?: string;
};

export function VideoBriefingPlayer({
  tripId,
  language: initialLanguage = 'id',
}: VideoBriefingPlayerProps) {
  const [language, setLanguage] = useState(initialLanguage);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data, isLoading, error } = useQuery<{
    video: {
      id: string;
      title: string;
      description?: string;
      videoUrl: string;
      thumbnailUrl?: string;
      durationSeconds?: number;
      fileSizeBytes?: number;
      language: string;
      isAvailableOffline: boolean;
      offlineDownloadUrl?: string;
    } | null;
  }>({
    queryKey: [...queryKeys.guide.tripsBriefing(tripId), 'video', language],
    queryFn: async () => {
      const res = await fetch(
        `/api/guide/trips/${tripId}/briefing/video?language=${language}`
      );
      if (!res.ok) throw new Error('Failed to fetch video');
      return res.json();
    },
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [data?.video]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = async () => {
    if (!data?.video?.offlineDownloadUrl) return;

    try {
      const link = document.createElement('a');
      link.href = data.video.offlineDownloadUrl;
      link.download = `${data.video.title}.mp4`;
      link.click();
    } catch (err) {
      logger.error('Failed to download video', err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <ErrorState message="Gagal memuat video briefing" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.video) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Video}
            title="Tidak ada video briefing"
            description="Video briefing belum tersedia untuk trip ini"
          />
        </CardContent>
      </Card>
    );
  }

  const video = data.video;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{video.title}</CardTitle>
            {video.description && (
              <p className="mt-1 text-sm text-slate-600">{video.description}</p>
            )}
          </div>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">Bahasa Indonesia</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Player */}
        <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-900">
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.thumbnailUrl}
            className="h-full w-full object-contain"
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        </div>

        {/* Video Info */}
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-4">
            {video.durationSeconds && (
              <span>Durasi: {formatTime(video.durationSeconds)}</span>
            )}
            {video.fileSizeBytes && (
              <span>Ukuran: {formatFileSize(video.fileSizeBytes)}</span>
            )}
          </div>
          {video.isAvailableOffline && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download untuk Offline
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        {duration > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
