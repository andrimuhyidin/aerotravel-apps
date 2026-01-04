/**
 * Music Playlist Card with Spotify Deep-links
 * AI-generated playlist suggestions with Spotify integration
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ExternalLink,
  Headphones,
  Loader2,
  Music,
  Play,
  RefreshCw,
  Sparkles,
  Volume2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type PlaylistReference = {
  id: string;
  name: string;
  category: 'relaxing' | 'upbeat' | 'ambient' | 'traditional' | 'chill' | 'party';
  description: string;
  genre?: string;
  mood?: string;
  suitable_for?: string[];
  spotifySearchQuery?: string;
};

type MusicPlaylistCardProps = {
  tripId: string;
  locale?: string;
  className?: string;
  compact?: boolean;
};

// Spotify search URL generator
function getSpotifySearchUrl(query: string): string {
  const encodedQuery = encodeURIComponent(query);
  // Try Spotify app first, fallback to web
  return `spotify:search:${encodedQuery}`;
}

function getSpotifyWebUrl(query: string): string {
  const encodedQuery = encodeURIComponent(query);
  return `https://open.spotify.com/search/${encodedQuery}`;
}

// Pre-made playlist suggestions based on categories
const categoryPlaylists: Record<string, { name: string; query: string }[]> = {
  relaxing: [
    { name: 'Acoustic Covers', query: 'acoustic covers chill' },
    { name: 'Peaceful Piano', query: 'peaceful piano instrumental' },
    { name: 'Nature Sounds', query: 'ocean waves relaxing' },
  ],
  upbeat: [
    { name: 'Summer Hits', query: 'summer hits 2024' },
    { name: 'Feel Good Pop', query: 'feel good pop hits' },
    { name: 'Beach Party', query: 'beach party music' },
  ],
  ambient: [
    { name: 'Lo-Fi Beats', query: 'lofi beats chill' },
    { name: 'Underwater Sounds', query: 'underwater ambient' },
    { name: 'Tropical Chill', query: 'tropical house chill' },
  ],
  traditional: [
    { name: 'Indonesian Traditional', query: 'musik tradisional indonesia' },
    { name: 'Gamelan', query: 'gamelan instrumental' },
    { name: 'Island Vibes', query: 'island music tropical' },
  ],
  chill: [
    { name: 'Chill Vibes', query: 'chill vibes playlist' },
    { name: 'Sunset Lounge', query: 'sunset lounge music' },
    { name: 'Coffee Shop', query: 'coffee shop music' },
  ],
  party: [
    { name: 'Dance Hits', query: 'dance hits 2024' },
    { name: 'EDM Summer', query: 'edm summer festival' },
    { name: 'Party Mix', query: 'party mix hits' },
  ],
};

export function MusicPlaylistCard({
  tripId,
  locale: _locale = 'id',
  className,
  compact = false,
}: MusicPlaylistCardProps) {
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistReference[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/guide/trips/${tripId}/engagement/music`);
      if (!res.ok) {
        throw new Error('Gagal mengambil referensi musik');
      }
      const data = (await res.json()) as { playlists: PlaylistReference[] };
      setPlaylists(data.playlists || []);
    } catch (err) {
      logger.error('Failed to fetch music playlists', err, { tripId });
      // Use fallback playlists
      setPlaylists([
        {
          id: '1',
          name: 'Relaxing Beach Vibes',
          category: 'relaxing',
          description: 'Cocok untuk perjalanan santai ke pulau',
          mood: 'calm',
        },
        {
          id: '2',
          name: 'Upbeat Adventure',
          category: 'upbeat',
          description: 'Untuk aktivitas snorkeling dan water sports',
          mood: 'energetic',
        },
        {
          id: '3',
          name: 'Sunset Chill',
          category: 'ambient',
          description: 'Sempurna untuk menikmati sunset',
          mood: 'peaceful',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void fetchPlaylists();
  }, [fetchPlaylists]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'relaxing':
        return '🌊';
      case 'upbeat':
        return '🎉';
      case 'ambient':
        return '✨';
      case 'traditional':
        return '🎵';
      case 'chill':
        return '☕';
      case 'party':
        return '🎊';
      default:
        return '🎧';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'relaxing':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'upbeat':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'ambient':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'traditional':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'chill':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'party':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleOpenSpotify = (query: string, playlistId: string) => {
    // Try to open Spotify app first
    const spotifyUri = getSpotifySearchUrl(query);
    const spotifyWebUrl = getSpotifyWebUrl(query);
    
    // Set playing state for visual feedback
    setIsPlaying(playlistId);
    setTimeout(() => setIsPlaying(null), 2000);
    
    // Try to open Spotify app, fallback to web
    const link = document.createElement('a');
    link.href = spotifyUri;
    link.click();
    
    // Fallback to web after a short delay if app doesn't open
    setTimeout(() => {
      window.open(spotifyWebUrl, '_blank');
    }, 500);
    
    toast.success('Membuka Spotify...', {
      description: query,
    });
  };

  const categories = Array.from(new Set(playlists.map(p => p.category)));

  if (compact) {
    return (
      <Card className={cn('border shadow-sm', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-green-500" />
              <span className="font-medium">Music Playlists</span>
            </div>
            <Badge className="bg-green-100 text-green-700 text-xs">
              <Headphones className="mr-1 h-3 w-3" />
              Spotify
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {['relaxing', 'upbeat', 'ambient'].map((cat) => (
              <Button
                key={cat}
                variant="outline"
                size="sm"
                className={cn('gap-1 text-xs', getCategoryColor(cat))}
                onClick={() => {
                  const playlist = categoryPlaylists[cat]?.[0];
                  if (playlist) {
                    handleOpenSpotify(playlist.query, cat);
                  }
                }}
              >
                {getCategoryIcon(cat)} {cat}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border shadow-sm', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-500" />
            AI Music Playlists
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void fetchPlaylists()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="text-xs"
          >
            Semua
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="text-xs gap-1"
            >
              {getCategoryIcon(cat)} {cat}
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-green-500" />
          </div>
        )}

        {/* Playlists */}
        {!loading && (
          <div className="space-y-3">
            {playlists
              .filter(p => !selectedCategory || p.category === selectedCategory)
              .map((playlist) => (
                <div
                  key={playlist.id}
                  className={cn(
                    'rounded-lg border p-3 transition-colors',
                    isPlaying === playlist.id
                      ? 'bg-green-50 border-green-300'
                      : 'bg-slate-50 border-slate-200'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getCategoryIcon(playlist.category)}</span>
                        <span className="font-medium text-slate-900 truncate">
                          {playlist.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('text-xs shrink-0', getCategoryColor(playlist.category))}
                        >
                          {playlist.category}
                        </Badge>
                      </div>
                      {playlist.description && (
                        <p className="text-xs text-slate-600 mb-2">
                          {playlist.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {playlist.mood && (
                          <span className="text-xs text-slate-500">
                            Mood: {playlist.mood}
                          </span>
                        )}
                        {playlist.genre && (
                          <span className="text-xs text-slate-500">
                            • {playlist.genre}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className={cn(
                        'shrink-0 gap-1',
                        isPlaying === playlist.id
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-green-600 hover:bg-green-700'
                      )}
                      onClick={() => {
                        const query = playlist.spotifySearchQuery || `${playlist.name} ${playlist.mood || ''} ${playlist.genre || ''}`;
                        handleOpenSpotify(query.trim(), playlist.id);
                      }}
                    >
                      {isPlaying === playlist.id ? (
                        <Volume2 className="h-4 w-4 animate-pulse" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Spotify
                    </Button>
                  </div>
                </div>
              ))}

            {/* Quick Access Pre-made Playlists */}
            <div className="border-t pt-4">
              <p className="text-xs font-medium text-slate-700 mb-2">
                Quick Access Playlists
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(categoryPlaylists)
                  .slice(0, 4)
                  .map(([category, lists]) => (
                    <Button
                      key={category}
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 text-xs h-auto py-2"
                      onClick={() => {
                        const playlist = lists[0];
                        if (playlist) {
                          handleOpenSpotify(playlist.query, category);
                        }
                      }}
                    >
                      <span>{getCategoryIcon(category)}</span>
                      <div className="text-left">
                        <p className="font-medium capitalize">{category}</p>
                        <p className="text-[10px] text-slate-500">
                          {lists[0]?.name}
                        </p>
                      </div>
                      <ExternalLink className="h-3 w-3 ml-auto text-green-500" />
                    </Button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Spotify Branding */}
        <div className="flex items-center justify-center gap-2 rounded-lg bg-black px-3 py-2 text-white">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span className="text-xs">Open with Spotify</span>
        </div>
      </CardContent>
    </Card>
  );
}

