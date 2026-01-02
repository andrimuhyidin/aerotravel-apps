'use client';

/**
 * Stories Carousel Component
 * Instagram-like stories at top of social feed
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MapPin,
  Pause,
  Play,
  Plus,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

type Story = {
  id: string;
  guide_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  location: string | null;
  duration_seconds: number;
  views_count: number;
  created_at: string;
  has_viewed: boolean;
};

type StoryGroup = {
  guide: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  stories: Story[];
  has_unseen: boolean;
};

type StoriesData = {
  story_groups: StoryGroup[];
  my_stories_count: number;
  total_stories: number;
};

type StoriesCarouselProps = {
  locale: string;
  currentUserId: string;
};

export function StoriesCarousel({ locale: _locale, currentUserId }: StoriesCarouselProps) {
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const progressRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<StoriesData>({
    queryKey: [...queryKeys.guide.all, 'stories'],
    queryFn: async () => {
      const res = await fetch('/api/guide/social/stories');
      if (!res.ok) throw new Error('Failed to fetch stories');
      return res.json();
    },
    staleTime: 30000,
  });

  const viewMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const res = await fetch(`/api/guide/social/stories/${storyId}/view`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to record view');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { media_url: string; caption?: string; location?: string }) => {
      const res = await fetch('/api/guide/social/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_url: payload.media_url,
          media_type: 'image', // Default to image for now
          caption: payload.caption,
          location: payload.location,
        }),
      });
      if (!res.ok) throw new Error('Failed to create story');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Story berhasil dibuat!');
      setShowCreateDialog(false);
      setMediaUrl('');
      setCaption('');
      setLocation('');
      queryClient.invalidateQueries({ queryKey: [...queryKeys.guide.all, 'stories'] });
    },
    onError: (error: Error) => {
      logger.error('Failed to create story', error);
      toast.error('Gagal membuat story');
    },
  });

  const storyGroups = data?.story_groups || [];
  const selectedGroup = selectedGroupIndex !== null ? storyGroups[selectedGroupIndex] : null;
  const currentStory = selectedGroup?.stories[currentStoryIndex];

  // Auto-advance story
  useEffect(() => {
    if (!currentStory || isPaused || selectedGroupIndex === null) return;

    const duration = (currentStory.duration_seconds || 5) * 1000;
    progressRef.current = 0;

    const interval = setInterval(() => {
      progressRef.current += 100;
      if (progressRef.current >= duration) {
        handleNextStory();
      }
    }, 100);

    timerRef.current = interval;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStory?.id, isPaused, selectedGroupIndex]);

  // Record view when story is shown
  useEffect(() => {
    if (currentStory && !currentStory.has_viewed && currentStory.guide_id !== currentUserId) {
      viewMutation.mutate(currentStory.id);
    }
  }, [currentStory?.id]);

  const handleOpenStory = (groupIndex: number) => {
    setSelectedGroupIndex(groupIndex);
    setCurrentStoryIndex(0);
    setIsPaused(false);
  };

  const handleCloseStory = () => {
    setSelectedGroupIndex(null);
    setCurrentStoryIndex(0);
    setIsPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleNextStory = () => {
    if (!selectedGroup) return;

    if (currentStoryIndex < selectedGroup.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    } else {
      // Move to next group
      if (selectedGroupIndex !== null && selectedGroupIndex < storyGroups.length - 1) {
        setSelectedGroupIndex((prev) => (prev !== null ? prev + 1 : 0));
        setCurrentStoryIndex(0);
      } else {
        handleCloseStory();
      }
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
    } else if (selectedGroupIndex !== null && selectedGroupIndex > 0) {
      setSelectedGroupIndex((prev) => (prev !== null ? prev - 1 : 0));
      const prevGroup = storyGroups[selectedGroupIndex - 1];
      if (prevGroup) {
        setCurrentStoryIndex(prevGroup.stories.length - 1);
      }
    }
  };

  const handleCreateStory = () => {
    if (!mediaUrl.trim()) {
      toast.error('URL media tidak boleh kosong');
      return;
    }
    createMutation.mutate({ media_url: mediaUrl, caption, location });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Baru saja';
    if (diffHours === 1) return '1 jam lalu';
    return `${diffHours} jam lalu`;
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto py-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 w-16 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Stories Carousel */}
      <div className="flex gap-3 overflow-x-auto py-2 scrollbar-hide">
        {/* Add Story Button */}
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex flex-shrink-0 flex-col items-center gap-1"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50">
            <Plus className="h-6 w-6 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-600">Tambah</span>
        </button>

        {/* Story Groups */}
        {storyGroups.map((group, index) => (
          <button
            key={group.guide.id}
            onClick={() => handleOpenStory(index)}
            className="flex flex-shrink-0 flex-col items-center gap-1"
          >
            <div
              className={cn(
                'rounded-full p-0.5',
                group.has_unseen
                  ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-500'
                  : 'bg-slate-300'
              )}
            >
              <Avatar className="h-14 w-14 border-2 border-white">
                <AvatarImage src={group.guide.avatar_url || undefined} />
                <AvatarFallback className="bg-slate-100 text-slate-700">
                  {group.guide.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="max-w-16 truncate text-[10px] text-slate-700">
              {group.guide.id === currentUserId ? 'Story Anda' : group.guide.full_name.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {selectedGroup && currentStory && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Progress Bars */}
          <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-2">
            {selectedGroup.stories.map((story, idx) => (
              <div key={story.id} className="h-1 flex-1 rounded-full bg-white/30">
                <div
                  className={cn(
                    'h-full rounded-full bg-white transition-all',
                    idx < currentStoryIndex && 'w-full',
                    idx === currentStoryIndex && 'animate-story-progress',
                    idx > currentStoryIndex && 'w-0'
                  )}
                  style={{
                    width: idx === currentStoryIndex ? `${(progressRef.current / ((currentStory.duration_seconds || 5) * 1000)) * 100}%` : undefined,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute left-0 right-0 top-4 z-10 flex items-center justify-between px-4 pt-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={selectedGroup.guide.avatar_url || undefined} />
                <AvatarFallback>{selectedGroup.guide.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-white">
                  {selectedGroup.guide.full_name}
                </p>
                <p className="text-xs text-white/70">{formatTimeAgo(currentStory.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={handleCloseStory}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Story Content */}
          <div className="flex h-full items-center justify-center">
            {currentStory.media_type === 'video' ? (
              <video
                src={currentStory.media_url}
                className="h-full w-full object-contain"
                autoPlay
                muted={isMuted}
                loop={false}
              />
            ) : (
              <Image
                src={currentStory.media_url}
                alt="Story"
                fill
                className="object-contain"
                priority
              />
            )}
          </div>

          {/* Navigation Areas */}
          <button
            className="absolute bottom-0 left-0 top-20 w-1/3"
            onClick={handlePrevStory}
          />
          <button
            className="absolute bottom-0 right-0 top-20 w-1/3"
            onClick={handleNextStory}
          />

          {/* Caption & Location */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
            {currentStory.location && (
              <div className="mb-2 flex items-center gap-1 text-xs text-white/80">
                <MapPin className="h-3 w-3" />
                {currentStory.location}
              </div>
            )}
            {currentStory.caption && (
              <p className="text-sm text-white">{currentStory.caption}</p>
            )}
            <div className="mt-2 flex items-center gap-1 text-xs text-white/60">
              <Eye className="h-3 w-3" />
              {currentStory.views_count} views
            </div>
          </div>
        </div>
      )}

      {/* Create Story Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Buat Story Baru
            </DialogTitle>
            <DialogDescription>
              Story akan terlihat selama 24 jam
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>URL Media (Gambar/Video)</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Caption (opsional)</Label>
              <Input
                placeholder="Tulis caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label>Lokasi (opsional)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="Tambah lokasi..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleCreateStory}
              disabled={createMutation.isPending || !mediaUrl.trim()}
              className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Membuat...
                </>
              ) : (
                'Bagikan Story'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

