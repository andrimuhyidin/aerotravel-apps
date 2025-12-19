/**
 * Social Feed Client Component
 * Display social posts from guides
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';

type SocialPost = {
  id: string;
  guideId: string;
  guideName: string;
  guideAvatar: string | null;
  caption: string;
  photos: string[];
  tripCode: string | null;
  tripDate: string | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
};

type SocialFeedResponse = {
  posts: SocialPost[];
  hasMore: boolean;
};

type SocialFeedClientProps = {
  locale: string;
};

export function SocialFeedClient({ locale: _locale }: SocialFeedClientProps) {
  const queryClient = useQueryClient();
  const [page] = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery<SocialFeedResponse>({
    queryKey: [...queryKeys.guide.all, 'social', 'feed', page],
    queryFn: async () => {
      const res = await fetch(`/api/guide/social/feed?limit=${limit}&offset=${page * limit}`);
      if (!res.ok) throw new Error('Failed to fetch feed');
      return res.json();
    },
    staleTime: 30000,
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/guide/social/posts/${postId}/like`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to like post');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.guide.all, 'social', 'feed'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const posts = data?.posts || [];

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            Belum ada postingan. Jadilah yang pertama membagikan pengalaman trip Anda!
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
                  {post.guideAvatar ? (
                    <img
                      src={post.guideAvatar}
                      alt={post.guideName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-slate-600">
                      {post.guideName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{post.guideName}</p>
                      {post.tripCode && (
                        <p className="text-xs text-slate-500">{post.tripCode}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{post.caption}</p>
                  {post.photos && post.photos.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {post.photos.slice(0, 4).map((photo, i) => (
                        <img
                          key={i}
                          src={photo}
                          alt={`Photo ${i + 1}`}
                          className="h-32 w-full rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => likeMutation.mutate(post.id)}
                      disabled={likeMutation.isPending}
                      className={post.isLiked ? 'text-red-500' : ''}
                    >
                      <Heart
                        className={`h-4 w-4 ${post.isLiked ? 'fill-red-500' : ''}`}
                      />
                      <span className="ml-1">{post.likesCount}</span>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4" />
                      <span className="ml-1">{post.commentsCount}</span>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

